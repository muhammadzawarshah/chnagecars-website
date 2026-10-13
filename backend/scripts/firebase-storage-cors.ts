/**
 * One-time setup for STORAGE_DRIVER=firebase: lets browsers on CORS_ORIGINS upload to the
 * Firebase Storage bucket with presigned PUT URLs (website sell forms, Beat My Quote).
 * The mobile app does not need this. Reads FIREBASE_* and CORS_ORIGINS from the environment / .env.
 *
 *   npx tsx scripts/firebase-storage-cors.ts
 */
import 'dotenv/config';
import { Storage } from '@google-cloud/storage';
import { parseServiceAccount } from '../src/infrastructure/storage/storage.service';

async function main() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!bucketName || !serviceAccount) throw new Error('Set FIREBASE_STORAGE_BUCKET and FIREBASE_SERVICE_ACCOUNT');
  const origins = (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length) throw new Error('Set CORS_ORIGINS to the website origin(s)');

  const credentials = parseServiceAccount(serviceAccount);
  const bucket = new Storage({ projectId: credentials.project_id, credentials }).bucket(bucketName);
  await bucket.setCorsConfiguration([
    { origin: origins, method: ['GET', 'HEAD', 'PUT'], responseHeader: ['Content-Type'], maxAgeSeconds: 3600 },
  ]);
  const [metadata] = await bucket.getMetadata();
  console.log(`CORS set on ${bucketName}:`, JSON.stringify(metadata.cors));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
