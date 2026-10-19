import { createHash, createVerify, generateKeyPairSync } from 'node:crypto';
import { validateEnv } from '../../config/env';
import { FirebaseObjectStore, parseServiceAccount, S3ObjectStore, StorageService } from './storage.service';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const serviceAccount = {
  type: 'service_account',
  project_id: 'test-project',
  client_email: 'uploader@test-project.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
};
const BUCKET = 'test-project.firebasestorage.app';
const KEY = 'private/customers/user-a/documents/doc 1.pdf';

function config(env: Record<string, unknown>) {
  return { get: (key: string) => env[key], isProduction: env.NODE_ENV === 'production' } as any;
}
const firebaseEnv = { STORAGE_DRIVER: 'firebase', FIREBASE_STORAGE_BUCKET: BUCKET, FIREBASE_SERVICE_ACCOUNT: JSON.stringify(serviceAccount) };

/** Recomputes the GCS V4 string-to-sign for a signed URL and checks its signature with the service account's public key. */
function verifyGcsV4(url: string, method: string): boolean {
  const parsed = new URL(url);
  const params = [...parsed.searchParams.entries()].filter(([name]) => name !== 'X-Goog-Signature');
  const canonicalQuery = params
    .map(([name, value]) => [encodeURIComponent(name), encodeURIComponent(value)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
    .join('&');
  const signedHeaders = parsed.searchParams.get('X-Goog-SignedHeaders')!;
  const canonicalHeaders = signedHeaders.split(';').map((name) => `${name}:${name === 'host' ? parsed.host : ''}\n`).join('');
  const canonicalRequest = [method, parsed.pathname, canonicalQuery, canonicalHeaders, signedHeaders, 'UNSIGNED-PAYLOAD'].join('\n');
  const scope = parsed.searchParams.get('X-Goog-Credential')!.split('/').slice(1).join('/');
  const stringToSign = ['GOOG4-RSA-SHA256', parsed.searchParams.get('X-Goog-Date'), scope, createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
  return createVerify('RSA-SHA256').update(stringToSign).verify(publicKey, Buffer.from(parsed.searchParams.get('X-Goog-Signature')!, 'hex'));
}

describe('parseServiceAccount', () => {
  it('accepts raw JSON and base64 JSON', () => {
    expect(parseServiceAccount(JSON.stringify(serviceAccount)).client_email).toBe(serviceAccount.client_email);
    expect(parseServiceAccount(Buffer.from(JSON.stringify(serviceAccount)).toString('base64')).project_id).toBe('test-project');
  });

  it('restores private key newlines that hosting dashboards escape', () => {
    const escaped = JSON.stringify({ ...serviceAccount, private_key: serviceAccount.private_key.replace(/\n/g, '\\n') });
    expect(parseServiceAccount(escaped).private_key).toBe(serviceAccount.private_key);
  });

  it('rejects the web client config and broken input with a clear message', () => {
    const webConfig = JSON.stringify({ apiKey: 'x', projectId: 'test-project', storageBucket: BUCKET });
    expect(() => parseServiceAccount(webConfig)).toThrow('must be a service account key');
    expect(() => parseServiceAccount('not json')).toThrow('not valid JSON');
  });
});

describe('storage environment', () => {
  const base = { DATABASE_URL: 'postgres://x', JWT_ACCESS_SECRET: 'a'.repeat(32) };

  it('defaults to the S3 driver', () => {
    expect(validateEnv(base).STORAGE_DRIVER).toBe('s3');
  });

  it('refuses to boot the Firebase driver without its bucket and service account', () => {
    expect(() => validateEnv({ ...base, STORAGE_DRIVER: 'firebase', FIREBASE_SERVICE_ACCOUNT: '' })).toThrow(
      /FIREBASE_STORAGE_BUCKET: required[\s\S]*FIREBASE_SERVICE_ACCOUNT: required/,
    );
    expect(validateEnv({ ...base, ...firebaseEnv }).FIREBASE_STORAGE_BUCKET).toBe(BUCKET);
  });
});

describe('FirebaseObjectStore', () => {
  it('presigns a V4 upload URL on Google storage that only signs the host', async () => {
    const store = new FirebaseObjectStore(config(firebaseEnv));
    const url = await store.presignUpload(KEY, 'application/pdf', 600);
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://storage.googleapis.com');
    expect(decodeURIComponent(parsed.pathname)).toBe(`/${BUCKET}/${KEY}`);
    expect(parsed.searchParams.get('X-Goog-Algorithm')).toBe('GOOG4-RSA-SHA256');
    expect(parsed.searchParams.get('X-Goog-Credential')).toMatch(/^uploader@test-project\.iam\.gserviceaccount\.com\//);
    expect(parsed.searchParams.get('X-Goog-Expires')).toBe('600');
    expect(parsed.searchParams.get('X-Goog-SignedHeaders')).toBe('host');
    expect(url).not.toContain('localhost');
    expect(verifyGcsV4(url, 'PUT')).toBe(true);
  });

  it('presigns a download URL valid for GET only', async () => {
    const store = new FirebaseObjectStore(config(firebaseEnv));
    const url = await store.presignDownload(KEY, 300);
    expect(new URL(url).searchParams.get('X-Goog-Expires')).toBe('300');
    expect(verifyGcsV4(url, 'GET')).toBe(true);
    expect(verifyGcsV4(url, 'PUT')).toBe(false);
  });

  it('serves public media through the Firebase download endpoint and ignores the S3 media URL', () => {
    const store = new FirebaseObjectStore(config({ ...firebaseEnv, MEDIA_PUBLIC_BASE_URL: 'http://localhost:9000/changecars-media' }));
    expect(store.publicUrl('media/vehicles/a b/large.webp')).toBe(
      `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/media%2Fvehicles%2Fa%20b%2Flarge.webp?alt=media`,
    );
  });

  describe('object operations', () => {
    function setup() {
      const file = {
        getMetadata: jest.fn(),
        download: jest.fn().mockResolvedValue([Buffer.from('bytes')]),
        save: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      const bucket = { file: jest.fn().mockReturnValue(file) };
      const gcs = { bucket: jest.fn().mockReturnValue(bucket) };
      return { file, bucket, gcs, store: new FirebaseObjectStore(config(firebaseEnv), gcs as any) };
    }

    it('reads size and content type, and returns null for a missing object', async () => {
      const { file, gcs, bucket, store } = setup();
      file.getMetadata.mockResolvedValueOnce([{ size: '142786', contentType: 'application/pdf' }]);
      await expect(store.head(KEY)).resolves.toEqual({ size: 142786, contentType: 'application/pdf' });
      expect(gcs.bucket).toHaveBeenCalledWith(BUCKET);
      expect(bucket.file).toHaveBeenCalledWith(KEY);
      file.getMetadata.mockRejectedValueOnce(Object.assign(new Error('No such object'), { code: 404 }));
      await expect(store.head(KEY)).resolves.toBeNull();
      file.getMetadata.mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { code: 403 }));
      await expect(store.head(KEY)).rejects.toThrow('Forbidden');
    });

    it('downloads, saves with type and cache headers, and deletes idempotently', async () => {
      const { file, store } = setup();
      await expect(store.getBuffer(KEY)).resolves.toEqual(Buffer.from('bytes'));
      await store.put('media/x.webp', Buffer.from('img'), 'image/webp', 'public, max-age=60');
      expect(file.save).toHaveBeenCalledWith(Buffer.from('img'), { resumable: false, contentType: 'image/webp', metadata: { cacheControl: 'public, max-age=60' } });
      await store.delete(KEY);
      expect(file.delete).toHaveBeenCalledWith({ ignoreNotFound: true });
    });
  });
});

describe('S3ObjectStore', () => {
  it('does not sign a checksum of an empty body into upload URLs', async () => {
    const store = new S3ObjectStore(
      config({ S3_REGION: 'af-south-1', S3_BUCKET: 'media', S3_ENDPOINT: 'https://s3.example.com', S3_FORCE_PATH_STYLE: true, S3_ACCESS_KEY_ID: 'id', S3_SECRET_ACCESS_KEY: 'secret', MEDIA_PUBLIC_BASE_URL: 'https://cdn.example.com/' }),
    );
    const url = await store.presignUpload(KEY, 'application/pdf', 600);
    expect(url).toMatch(/^https:\/\/s3\.example\.com\/media\//);
    expect(url).not.toMatch(/checksum/i);
    expect(store.publicUrl('media/a.webp')).toBe('https://cdn.example.com/media/a.webp');
  });
});

describe('StorageService', () => {
  it('uses the driver chosen by STORAGE_DRIVER', async () => {
    const firebase = new StorageService(config(firebaseEnv));
    expect(await firebase.presignUpload(KEY, 'application/pdf')).toMatch(/^https:\/\/storage\.googleapis\.com\//);
    const s3 = new StorageService(config({ STORAGE_DRIVER: 's3', S3_REGION: 'af-south-1', S3_BUCKET: 'media', S3_ENDPOINT: 'http://localhost:9000', S3_FORCE_PATH_STYLE: true, MEDIA_PUBLIC_BASE_URL: 'http://localhost:9000/media' }));
    expect(s3.publicUrl('media/a.webp')).toBe('http://localhost:9000/media/media/a.webp');
  });
});
