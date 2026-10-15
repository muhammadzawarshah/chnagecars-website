import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Prisma, SellMediaKind } from '../../generated/prisma/client';
import { AppError, Errors } from '../../common/errors/app-error';
import { shortId } from '../../common/utils/strings';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, StorageService } from '../../infrastructure/storage/storage.service';

/**
 * Photos and documents picked on the website's forms. Visitors are not signed in, so the form's
 * receipt carries a short-lived upload token for the record it created; files then go straight
 * from the browser to object storage with presigned URLs and are confirmed here.
 */

export type UploadKind = 'photo' | 'document';
type Target = { type: 'sell' | 'enquiry'; id: string };

const TOKEN_TTL_MS = 2 * 60 * 60_000;
const MB = 1024 * 1024;

export const UPLOAD_RULES: Record<UploadKind, { types: readonly string[]; maxBytes: number; maxFiles: number }> = {
  photo: { types: ALLOWED_IMAGE_TYPES, maxBytes: 10 * MB, maxFiles: 20 },
  document: { types: ALLOWED_DOCUMENT_TYPES, maxBytes: 5 * MB, maxFiles: 2 },
};

const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

type Attachment = { storageKey: string; contentType: string; fileName: string | null; sizeBytes: number };

@Injectable()
export class WebUploadsService {
  private readonly logger = new Logger(WebUploadsService.name);
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    config: AppConfig,
  ) {
    this.secret = `${config.get('JWT_ACCESS_SECRET')}:web-uploads`;
  }

  // ───────────── tokens ─────────────

  tokenFor(target: Target): string {
    const payload = Buffer.from(JSON.stringify({ t: target.type, id: target.id, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  private sign(payload: string) {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }

  private verify(token: unknown): Target {
    const invalid = () => Errors.forbidden('UPLOAD_TOKEN_INVALID', 'This upload link has expired. Please submit the form again.');
    if (typeof token !== 'string' || token.length > 600) throw invalid();
    const [payload, signature] = token.split('.');
    if (!payload || !signature) throw invalid();
    const expected = Buffer.from(this.sign(payload));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw invalid();
    let data: { t?: string; id?: string; exp?: number };
    try {
      data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      throw invalid();
    }
    if ((data.t !== 'sell' && data.t !== 'enquiry') || typeof data.id !== 'string' || !data.exp || data.exp < Date.now()) throw invalid();
    return { type: data.t, id: data.id };
  }

  // ───────────── uploads ─────────────

  async uploadUrl(input: { token: unknown; kind: unknown; contentType: unknown }) {
    const target = this.verify(input.token);
    const kind = this.kindFor(target, input.kind);
    const contentType = this.contentTypeFor(kind, input.contentType);
    if ((await this.count(target, kind)) >= UPLOAD_RULES[kind].maxFiles) {
      throw Errors.conflict('TOO_MANY_FILES', kind === 'photo' ? `You can add at most ${UPLOAD_RULES.photo.maxFiles} photos` : `You can add at most ${UPLOAD_RULES.document.maxFiles} documents`);
    }
    const storageKey = `${this.prefix(target, kind)}${Date.now()}-${shortId(10)}.${EXTENSIONS[contentType]}`;
    let uploadUrl: string;
    try {
      uploadUrl = await this.storage.presignUpload(storageKey, contentType);
    } catch (error) {
      this.logger.error(`Presigning an upload failed: ${(error as Error).message}`);
      throw new AppError(503, 'STORAGE_UNAVAILABLE', 'File uploads are not available right now. Please try again later.');
    }
    return { uploadUrl, storageKey, contentType, maxBytes: UPLOAD_RULES[kind].maxBytes };
  }

  async confirm(input: { token: unknown; kind: unknown; storageKey: unknown; contentType: unknown; fileName?: unknown }) {
    const target = this.verify(input.token);
    const kind = this.kindFor(target, input.kind);
    const contentType = this.contentTypeFor(kind, input.contentType);
    const storageKey = typeof input.storageKey === 'string' ? input.storageKey : '';
    if (!storageKey.startsWith(this.prefix(target, kind)) || storageKey.length > 300) throw Errors.forbidden('INVALID_STORAGE_KEY', 'This file does not belong to your request');
    const fileName = typeof input.fileName === 'string' ? input.fileName.replace(/[^\w .()-]/g, '').slice(0, 120) || null : null;

    let object: { size: number } | null;
    try {
      object = await this.storage.head(storageKey);
    } catch (error) {
      this.logger.error(`Checking an upload failed: ${(error as Error).message}`);
      throw new AppError(503, 'STORAGE_UNAVAILABLE', 'File uploads are not available right now. Please try again later.');
    }
    if (!object) throw Errors.badRequest('UPLOAD_NOT_FOUND', 'The file did not finish uploading. Please try again.');
    if (object.size > UPLOAD_RULES[kind].maxBytes) {
      await this.storage.delete(storageKey).catch(() => undefined);
      throw Errors.badRequest('FILE_TOO_LARGE', `${kind === 'photo' ? 'Photos' : 'Documents'} may be at most ${UPLOAD_RULES[kind].maxBytes / MB} MB`);
    }

    if (target.type === 'sell') {
      const existing = await this.prisma.sellRequestImage.findUnique({ where: { storageKey } });
      if (!existing) {
        const mediaKind = kind === 'photo' ? SellMediaKind.PHOTO : SellMediaKind.REGISTRATION_DOCUMENT;
        const position = await this.prisma.sellRequestImage.count({ where: { sellRequestId: target.id, kind: mediaKind } });
        await this.prisma.sellRequestImage.create({ data: { sellRequestId: target.id, kind: mediaKind, storageKey, contentType, fileName, sizeBytes: object.size, position } });
      }
    } else {
      await this.prisma.$transaction(async (tx) => {
        const enquiry = await tx.enquiry.findUnique({ where: { id: target.id }, select: { details: true } });
        if (!enquiry) throw Errors.notFound('Enquiry');
        const details = (enquiry.details && typeof enquiry.details === 'object' ? enquiry.details : {}) as Record<string, unknown>;
        const attachments = (Array.isArray(details.attachments) ? details.attachments : []) as Attachment[];
        if (attachments.some((file) => file.storageKey === storageKey)) return;
        attachments.push({ storageKey, contentType, fileName, sizeBytes: object.size });
        await tx.enquiry.update({ where: { id: target.id }, data: { details: { ...details, attachments } as Prisma.InputJsonValue } });
      });
    }
    return { ok: true };
  }

  private kindFor(target: Target, value: unknown): UploadKind {
    if (value === 'document' || (value === 'photo' && target.type === 'sell')) return value;
    throw Errors.badRequest('INVALID_UPLOAD_KIND', 'This form does not accept that kind of file');
  }

  private contentTypeFor(kind: UploadKind, value: unknown): string {
    if (typeof value === 'string' && UPLOAD_RULES[kind].types.includes(value)) return value;
    throw Errors.badRequest('UNSUPPORTED_FILE_TYPE', kind === 'photo' ? 'Photos must be JPG, PNG or WebP images' : 'Documents must be PDF, JPG or PNG files');
  }

  private prefix(target: Target, kind: UploadKind) {
    if (target.type === 'enquiry') return `private/enquiries/${target.id}/`;
    return kind === 'photo' ? `media/sell-requests/${target.id}/` : `private/sell-requests/${target.id}/documents/`;
  }

  private async count(target: Target, kind: UploadKind) {
    if (target.type === 'sell') {
      return this.prisma.sellRequestImage.count({ where: { sellRequestId: target.id, kind: kind === 'photo' ? SellMediaKind.PHOTO : SellMediaKind.REGISTRATION_DOCUMENT } });
    }
    const enquiry = await this.prisma.enquiry.findUnique({ where: { id: target.id }, select: { details: true } });
    if (!enquiry) throw Errors.notFound('Enquiry');
    const details = (enquiry.details ?? {}) as Record<string, unknown>;
    return Array.isArray(details.attachments) ? details.attachments.length : 0;
  }
}
