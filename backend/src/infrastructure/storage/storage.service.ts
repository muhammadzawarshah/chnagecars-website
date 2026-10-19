import { Global, Injectable, Logger, Module } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Storage } from '@google-cloud/storage';
import { AppConfig } from '../../config/app-config.service';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/** One storage backend. StorageService picks one at boot from STORAGE_DRIVER. */
export interface ObjectStore {
  presignUpload(key: string, contentType: string, expiresInSeconds: number): Promise<string>;
  presignDownload(key: string, expiresInSeconds: number): Promise<string>;
  head(key: string): Promise<{ size: number; contentType?: string } | null>;
  getBuffer(key: string): Promise<Buffer>;
  put(key: string, body: Buffer, contentType: string, cacheControl: string): Promise<void>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

/** S3-compatible storage: AWS S3, Cloudflare R2, MinIO. */
export class S3ObjectStore implements ObjectStore {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(config: AppConfig) {
    const accessKeyId = config.get('S3_ACCESS_KEY_ID');
    const secretAccessKey = config.get('S3_SECRET_ACCESS_KEY');
    this.client = new S3Client({
      region: config.get('S3_REGION'),
      endpoint: config.get('S3_ENDPOINT') || undefined,
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE'),
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      // Without this the SDK signs a CRC32 of an empty body into presigned PUT URLs, and S3/R2 then reject the real file.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    this.bucket = config.get('S3_BUCKET');
    this.publicBase = config.get('MEDIA_PUBLIC_BASE_URL').replace(/\/+$/, '');
  }

  presignUpload(key: string, contentType: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }), {
      expiresIn: expiresInSeconds,
    });
  }

  presignDownload(key: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresInSeconds });
  }

  async head(key: string): Promise<{ size: number; contentType?: string } | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: result.ContentLength ?? 0, contentType: result.ContentType };
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404 || (error as Error).name === 'NotFound') return null;
      throw error;
    }
  }

  async getBuffer(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await result.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  async put(key: string, body: Buffer, contentType: string, cacheControl: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }
}

/**
 * Firebase Storage (a Google Cloud Storage bucket), used through a service account.
 * Signed URLs are GCS V4 URLs on storage.googleapis.com; the client PUTs the raw bytes
 * with the Content-Type it asked for. Public media (media/...) is served through the
 * Firebase download endpoint, so storage rules must allow reading media/**.
 */
export class FirebaseObjectStore implements ObjectStore {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(config: AppConfig, storage?: Storage) {
    this.bucketName = config.get('FIREBASE_STORAGE_BUCKET')!;
    if (storage) {
      this.storage = storage;
    } else {
      const credentials = parseServiceAccount(config.get('FIREBASE_SERVICE_ACCOUNT')!);
      this.storage = new Storage({ projectId: credentials.project_id, credentials });
    }
  }

  private file(key: string) {
    return this.storage.bucket(this.bucketName).file(key);
  }

  async presignUpload(key: string, _contentType: string, expiresInSeconds: number): Promise<string> {
    // Content-Type is deliberately not signed (same as the S3 driver): the confirm steps check the stored type instead.
    const [url] = await this.file(key).getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + expiresInSeconds * 1000 });
    return url;
  }

  async presignDownload(key: string, expiresInSeconds: number): Promise<string> {
    const [url] = await this.file(key).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + expiresInSeconds * 1000 });
    return url;
  }

  async head(key: string): Promise<{ size: number; contentType?: string } | null> {
    try {
      const [metadata] = await this.file(key).getMetadata();
      return { size: Number(metadata.size ?? 0), contentType: metadata.contentType };
    } catch (error) {
      if ((error as { code?: number }).code === 404) return null;
      throw error;
    }
  }

  async getBuffer(key: string): Promise<Buffer> {
    const [contents] = await this.file(key).download();
    return contents;
  }

  async put(key: string, body: Buffer, contentType: string, cacheControl: string): Promise<void> {
    await this.file(key).save(body, { resumable: false, contentType, metadata: { cacheControl } });
  }

  async delete(key: string): Promise<void> {
    await this.file(key).delete({ ignoreNotFound: true });
  }

  publicUrl(key: string): string {
    return `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodeURIComponent(key)}?alt=media`;
  }
}

/** Accepts the service account JSON as-is or base64-encoded (easier to paste into hosting settings). */
export function parseServiceAccount(raw: string): { project_id: string; client_email: string; private_key: string } {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  let parsed: { project_id?: string; client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON (paste the service account key file, or its base64)');
  }
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must be a service account key with project_id, client_email and private_key');
  }
  // Hosting dashboards often turn the key's newlines into literal "\n".
  return { project_id: parsed.project_id, client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, '\n') };
}

/**
 * Object storage. Uploaded media never lives on the API server's disk.
 * Clients upload directly with presigned URLs.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly store: ObjectStore;

  constructor(config: AppConfig) {
    if (config.get('STORAGE_DRIVER') === 'firebase') {
      this.store = new FirebaseObjectStore(config);
      this.logger.log(`Object storage: Firebase bucket ${config.get('FIREBASE_STORAGE_BUCKET')}`);
    } else {
      this.store = new S3ObjectStore(config);
      const endpoint = config.get('S3_ENDPOINT');
      if (config.isProduction && endpoint && /localhost|127\.0\.0\.1/.test(endpoint)) {
        this.logger.warn(`S3_ENDPOINT is ${endpoint}: clients cannot reach it, so uploads will fail. Set real storage.`);
      }
    }
  }

  /** Presigned PUT the client uses to upload directly to the bucket. */
  presignUpload(key: string, contentType: string, expiresInSeconds = 600): Promise<string> {
    return this.store.presignUpload(key, contentType, expiresInSeconds);
  }

  /** Presigned GET for private files (dealer verification documents). */
  presignDownload(key: string, expiresInSeconds = 300): Promise<string> {
    return this.store.presignDownload(key, expiresInSeconds);
  }

  head(key: string): Promise<{ size: number; contentType?: string } | null> {
    return this.store.head(key);
  }

  getBuffer(key: string): Promise<Buffer> {
    return this.store.getBuffer(key);
  }

  put(key: string, body: Buffer, contentType: string, cacheControl = DEFAULT_CACHE_CONTROL): Promise<void> {
    return this.store.put(key, body, contentType, cacheControl);
  }

  delete(key: string): Promise<void> {
    return this.store.delete(key);
  }

  publicUrl(key: string): string {
    return this.store.publicUrl(key);
  }
}

@Global()
@Module({ providers: [StorageService], exports: [StorageService] })
export class StorageModule {}
