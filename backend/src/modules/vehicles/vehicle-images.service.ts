import { Injectable, Logger } from '@nestjs/common';
import sharp, { Metadata } from 'sharp';
import { ImageStatus, VehicleStatus } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';
import { Errors } from '../../common/errors/app-error';
import { shortId } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import type { Db } from '../../infrastructure/database';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { ALLOWED_IMAGE_TYPES, StorageService } from '../../infrastructure/storage/storage.service';
import { DealerAccessService, DealerContext } from '../dealers/dealer-access';
import { ImageUploadRequestDto, UpdateImageDto } from './dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

/** Generated renditions (NFR-16 "generate suitable image sizes"). */
const RENDITIONS = [
  { name: 'thumb', width: 320 },
  { name: 'medium', width: 800 },
  { name: 'large', width: 1600 },
] as const;

const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const LOCKED: VehicleStatus[] = [VehicleStatus.SOLD, VehicleStatus.ARCHIVED, VehicleStatus.PENDING_REVIEW];

/**
 * Upload flow (brief section 10): client asks for a presigned URL → uploads straight to object
 * storage → confirms → worker validates the real file, strips metadata and renders WebP sizes.
 */
@Injectable()
export class VehicleImagesService {
  private readonly logger = new Logger(VehicleImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
    private readonly config: AppConfig,
    private readonly vehicles: VehiclesService,
  ) {}

  private async ownVehicle(ctx: DealerContext, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx) } });
    if (!vehicle) throw Errors.notFound('Vehicle');
    if (LOCKED.includes(vehicle.status)) throw Errors.conflict('VEHICLE_LOCKED', `Photos cannot be changed while the vehicle is ${vehicle.status}`);
    return vehicle;
  }

  async requestUpload(ctx: DealerContext, vehicleId: string, dto: ImageUploadRequestDto) {
    await this.ownVehicle(ctx, vehicleId);
    if (dto.sizeBytes > this.config.get('MEDIA_MAX_IMAGE_BYTES')) {
      throw Errors.badRequest('FILE_TOO_LARGE', `Images may be at most ${Math.round(this.config.get('MEDIA_MAX_IMAGE_BYTES') / 1048576)} MB`);
    }
    const count = await this.prisma.vehicleImage.count({ where: { vehicleId, status: { not: ImageStatus.FAILED } } });
    if (count >= this.config.get('MEDIA_MAX_IMAGES_PER_VEHICLE')) {
      throw Errors.conflict('TOO_MANY_IMAGES', `A vehicle can have at most ${this.config.get('MEDIA_MAX_IMAGES_PER_VEHICLE')} photos`);
    }
    const storageKey = `uploads/vehicles/${vehicleId}/${Date.now()}-${shortId(10)}.${EXTENSIONS[dto.contentType]}`;
    const image = await this.prisma.vehicleImage.create({
      data: { vehicleId, storageKey, contentType: dto.contentType, sizeBytes: dto.sizeBytes, position: count, status: ImageStatus.PENDING_UPLOAD },
    });
    return {
      imageId: image.id,
      uploadUrl: await this.storage.presignUpload(storageKey, dto.contentType),
      method: 'PUT',
      headers: { 'Content-Type': dto.contentType },
      expiresIn: 600,
    };
  }

  async completeUpload(ctx: DealerContext, vehicleId: string, imageId: string) {
    await this.ownVehicle(ctx, vehicleId);
    const image = await this.prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId } });
    if (!image) throw Errors.notFound('Image');
    if (image.status !== ImageStatus.PENDING_UPLOAD) return image;

    const object = await this.storage.head(image.storageKey);
    if (!object) throw Errors.badRequest('UPLOAD_NOT_FOUND', 'The file has not been uploaded yet');
    if (object.size > this.config.get('MEDIA_MAX_IMAGE_BYTES')) {
      await this.fail(image.id, image.storageKey);
      throw Errors.badRequest('FILE_TOO_LARGE', 'Uploaded file is too large');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.vehicleImage.update({ where: { id: imageId }, data: { status: ImageStatus.PROCESSING, sizeBytes: object.size } });
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.VehicleImageUploaded,
        aggregateType: 'vehicle',
        aggregateId: vehicleId,
        payload: { imageId, vehicleId },
      });
      return updated;
    });
  }

  async update(ctx: DealerContext, vehicleId: string, imageId: string, dto: UpdateImageDto) {
    await this.ownVehicle(ctx, vehicleId);
    const image = await this.prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId } });
    if (!image) throw Errors.notFound('Image');
    await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) await tx.vehicleImage.updateMany({ where: { vehicleId }, data: { isPrimary: false } });
      await tx.vehicleImage.update({ where: { id: imageId }, data: dto });
      await this.syncVehicleImageFields(tx, vehicleId);
    });
    await this.vehicles.invalidate(VehicleStatus.PUBLISHED);
    return this.list(vehicleId);
  }

  async reorder(ctx: DealerContext, vehicleId: string, imageIds: string[]) {
    await this.ownVehicle(ctx, vehicleId);
    const images = await this.prisma.vehicleImage.findMany({ where: { vehicleId }, select: { id: true } });
    const known = new Set(images.map((image) => image.id));
    if (imageIds.some((id) => !known.has(id))) throw Errors.badRequest('UNKNOWN_IMAGE', 'One or more images do not belong to this vehicle');
    await this.prisma.$transaction(async (tx) => {
      for (const [position, id] of imageIds.entries()) {
        await tx.vehicleImage.update({ where: { id }, data: { position, isPrimary: position === 0 } });
      }
      await this.syncVehicleImageFields(tx, vehicleId);
    });
    await this.vehicles.invalidate(VehicleStatus.PUBLISHED);
    return this.list(vehicleId);
  }

  async remove(ctx: DealerContext, vehicleId: string, imageId: string) {
    await this.ownVehicle(ctx, vehicleId);
    const image = await this.prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId } });
    if (!image) throw Errors.notFound('Image');
    await this.prisma.$transaction(async (tx) => {
      await tx.vehicleImage.delete({ where: { id: imageId } });
      await this.syncVehicleImageFields(tx, vehicleId);
      await this.audit.record({ action: 'vehicle.image_delete', entityType: 'vehicle', entityId: vehicleId, before: { imageId, storageKey: image.storageKey } }, tx);
    });
    await this.deleteObjects(image.storageKey);
    await this.vehicles.invalidate(VehicleStatus.PUBLISHED);
  }

  list(vehicleId: string) {
    return this.prisma.vehicleImage.findMany({ where: { vehicleId }, orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }] });
  }

  /** Keeps the denormalised primary image + count on the vehicle row for fast listing queries. */
  private async syncVehicleImageFields(db: Db, vehicleId: string) {
    const ready = await db.vehicleImage.findMany({
      where: { vehicleId, status: ImageStatus.READY },
      orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
      select: { id: true, mediumUrl: true, url: true, isPrimary: true },
    });
    if (ready.length && !ready.some((image) => image.isPrimary)) {
      await db.vehicleImage.update({ where: { id: ready[0].id }, data: { isPrimary: true } });
    }
    await db.vehicle.update({
      where: { id: vehicleId },
      data: { primaryImageUrl: ready[0]?.mediumUrl ?? ready[0]?.url ?? null, imageCount: ready.length },
    });
  }

  // ───────────── worker side ─────────────

  /** Idempotent: re-running for an already processed image is a no-op. */
  async process(imageId: string): Promise<void> {
    const image = await this.prisma.vehicleImage.findUnique({ where: { id: imageId } });
    if (!image || image.status !== ImageStatus.PROCESSING) return;

    let original: Buffer;
    try {
      original = await this.storage.getBuffer(image.storageKey);
    } catch (error) {
      this.logger.warn(`Image ${imageId} could not be downloaded: ${(error as Error).message}`);
      throw error;
    }

    let metadata: Metadata;
    try {
      metadata = await sharp(original).metadata();
      const format = `image/${metadata.format === 'jpeg' ? 'jpeg' : metadata.format}`;
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(format)) throw new Error(`unsupported format ${metadata.format}`);
    } catch (error) {
      // Not a real image (or a disguised file): never publish it.
      this.logger.warn(`Image ${imageId} rejected: ${(error as Error).message}`);
      await this.fail(image.id, image.storageKey);
      return;
    }

    const base = image.storageKey.replace(/^uploads\//, 'media/').replace(/\.[a-z]+$/, '');
    const urls: Record<string, string> = {};
    for (const rendition of RENDITIONS) {
      // rotate() applies EXIF orientation; output has no EXIF/GPS metadata (privacy).
      const body = await sharp(original).rotate().resize({ width: rendition.width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      const key = `${base}-${rendition.name}.webp`;
      await this.storage.put(key, body, 'image/webp');
      urls[rendition.name] = this.storage.publicUrl(key);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.vehicleImage.update({
        where: { id: imageId },
        data: {
          status: ImageStatus.READY,
          url: urls.large,
          largeUrl: urls.large,
          mediumUrl: urls.medium,
          thumbnailUrl: urls.thumb,
          width: metadata.width,
          height: metadata.height,
        },
      });
      await this.syncVehicleImageFields(tx, image.vehicleId);
    });
    // The original upload is no longer needed once renditions exist.
    await this.storage.delete(image.storageKey).catch(() => undefined);
    await this.vehicles.invalidate(VehicleStatus.PUBLISHED);
  }

  private async fail(imageId: string, storageKey: string) {
    await this.prisma.vehicleImage.update({ where: { id: imageId }, data: { status: ImageStatus.FAILED } });
    await this.storage.delete(storageKey).catch(() => undefined);
  }

  private async deleteObjects(storageKey: string) {
    const base = storageKey.replace(/^uploads\//, 'media/').replace(/\.[a-z]+$/, '');
    const keys = [storageKey, ...RENDITIONS.map((rendition) => `${base}-${rendition.name}.webp`)];
    await Promise.all(keys.map((key) => this.storage.delete(key).catch(() => undefined)));
  }
}
