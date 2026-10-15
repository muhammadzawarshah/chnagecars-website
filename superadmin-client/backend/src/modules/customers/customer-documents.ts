import { randomUUID } from 'node:crypto';
import { Body, Controller, Delete, Get, Injectable, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { Errors } from '../../common/errors/app-error';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ALLOWED_DOCUMENT_TYPES, StorageService } from '../../infrastructure/storage/storage.service';

export const DOCUMENT_CATEGORIES = {
  DRIVING_LICENSE: 'Driving License', VEHICLE_REGISTRATION: 'Vehicle Registration',
  INSURANCE: 'Insurance', WARRANTY: 'Warranty', FINES: 'Fines', SERVICE_REPAIRS: 'Service & Repairs',
};
export class CustomerDocumentUploadDto {
  @ApiProperty({ enum: Object.keys(DOCUMENT_CATEGORIES) }) @IsIn(Object.keys(DOCUMENT_CATEGORIES)) type: string;
  @ApiProperty() @IsString() @MaxLength(200) fileName: string;
  @ApiProperty({ enum: ALLOWED_DOCUMENT_TYPES }) @IsIn(ALLOWED_DOCUMENT_TYPES) contentType: string;
  @ApiProperty({ maximum: 15728640 }) @IsInt() @Min(1) @Max(15728640) size: number;
}

@Injectable()
export class CustomerDocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  private async owned(userId: string, id: string) {
    const row = await this.prisma.customerDocument.findFirst({ where: { id, userId } });
    if (!row) throw Errors.notFound('Document');
    return row;
  }

  async list(userId: string) {
    const rows = await this.prisma.customerDocument.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return {
      canSubmit: rows.some(row => row.status === 'UPLOADED'),
      categories: Object.entries(DOCUMENT_CATEGORIES).map(([type, name]) => ({
        type, name, uploaded: rows.some(row => row.type === type && row.status !== 'PENDING'),
        documents: rows.filter(row => row.type === type).map(({ storageKey, userId: owner, ...row }) => row),
      })),
    };
  }

  async upload(userId: string, dto: CustomerDocumentUploadDto) {
    if (!dto.fileName.trim()) throw Errors.badRequest('INVALID_FILENAME', 'File name is required');
    const id = randomUUID();
    const extension = dto.contentType === 'application/pdf' ? 'pdf' : dto.contentType === 'image/png' ? 'png' : 'jpg';
    const storageKey = `private/customers/${userId}/documents/${id}.${extension}`;
    const uploadUrl = await this.storage.presignUpload(storageKey, dto.contentType);
    await this.prisma.customerDocument.create({ data: { id, userId, ...dto, fileName: dto.fileName.trim(), storageKey } });
    return { documentId: id, uploadUrl, method: 'PUT', headers: { 'Content-Type': dto.contentType }, expiresIn: 600 };
  }

  async complete(userId: string, id: string) {
    const row = await this.owned(userId, id);
    if (row.status === 'PENDING') {
      const object = await this.storage.head(row.storageKey);
      if (!object) throw Errors.badRequest('UPLOAD_NOT_FOUND', 'Upload the file before completing');
      if (object.size !== row.size || object.contentType !== row.contentType) {
        throw Errors.badRequest('INVALID_UPLOAD', 'Uploaded file size or content type does not match the upload request');
      }
      await this.prisma.customerDocument.updateMany({ where: { id, userId, status: 'PENDING' }, data: { status: 'UPLOADED' } });
    }
    const { storageKey, userId: owner, ...document } = await this.owned(userId, id);
    return document;
  }

  async view(userId: string, id: string) {
    const row = await this.owned(userId, id);
    if (row.status === 'PENDING') throw Errors.badRequest('UPLOAD_NOT_COMPLETED', 'Complete the upload first');
    return { documentId: id, fileName: row.fileName, downloadUrl: await this.storage.presignDownload(row.storageKey), expiresIn: 300 };
  }

  async remove(userId: string, id: string) {
    const row = await this.owned(userId, id);
    await this.storage.delete(row.storageKey);
    await this.prisma.customerDocument.deleteMany({ where: { id, userId } });
    return { documentId: id, deleted: true };
  }

  async submit(userId: string) {
    const submittedAt = new Date();
    const result = await this.prisma.customerDocument.updateMany({ where: { userId, status: 'UPLOADED' }, data: { status: 'SUBMITTED', submittedAt } });
    if (!result.count) throw Errors.badRequest('NO_DOCUMENTS_TO_SUBMIT', 'Upload and complete at least one new document first');
    return { submitted: true, count: result.count, submittedAt };
  }
}

@ApiTags('Customer documents')
@ApiBearerAuth()
@Controller('me/documents')
export class CustomerDocumentsController {
  constructor(private readonly documents: CustomerDocumentsService) {}
  @Get() @ApiOperation({ summary: 'My Documents screen with all six categories' })
  list(@CurrentUser() user: AuthUser) { return this.documents.list(user.id); }
  @Post('upload-url') @ApiOperation({ summary: 'Create a private document upload' })
  upload(@CurrentUser() user: AuthUser, @Body() dto: CustomerDocumentUploadDto) { return this.documents.upload(user.id, dto); }
  @Post('submit') @ApiOperation({ summary: 'Submit all completed new documents' })
  submit(@CurrentUser() user: AuthUser) { return this.documents.submit(user.id); }
  @Post(':id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.documents.complete(user.id, id); }
  @Get(':id/view')
  view(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.documents.view(user.id, id); }
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.documents.remove(user.id, id); }
}
