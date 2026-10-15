import { StorageService } from './storage.service';
import { AppConfig } from '../../config/app-config.service';

function service(publicEndpoint?: string) {
  const values: Record<string, unknown> = {
    S3_ACCESS_KEY_ID: 'review-access', S3_SECRET_ACCESS_KEY: 'review-secret',
    S3_REGION: 'us-east-1', S3_ENDPOINT: 'http://minio:9000',
    S3_PUBLIC_ENDPOINT: publicEndpoint, S3_FORCE_PATH_STYLE: true,
    S3_BUCKET: 'review', MEDIA_PUBLIC_BASE_URL: 'https://media.example.com/review',
  };
  return new StorageService({ get: (key: string) => values[key] } as unknown as AppConfig);
}

describe('Review deployment storage links', () => {
  it('signs browser downloads and uploads with the public endpoint', async () => {
    const storage = service('https://storage.example.com');
    expect(new URL(await storage.presignDownload('private/document.pdf')).origin).toBe('https://storage.example.com');
    expect(new URL(await storage.presignUpload('media/photo.jpg', 'image/jpeg')).origin).toBe('https://storage.example.com');
    expect(storage.publicUrl('media/photo.jpg')).toBe('https://media.example.com/review/media/photo.jpg');
  });
  it('keeps the configured endpoint when no separate public endpoint is set', async () => {
    expect(new URL(await service().presignDownload('document.pdf')).origin).toBe('http://minio:9000');
  });
});
