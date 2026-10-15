import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const target = new URL('.env', root);
if (existsSync(target)) {
  console.log('.env already exists; keeping your configuration.');
  process.exit(0);
}
const value = () => randomBytes(36).toString('base64url');
const secrets = { POSTGRES_PASSWORD: value(), JWT_ACCESS_SECRET: value(), WEB_ADAPTER_KEY: value(), SEED_ADMIN_PASSWORD: `Review9-${value()}`, MINIO_ROOT_PASSWORD: value() };
let text = readFileSync(new URL('.env.example', root), 'utf8');
for (const [key, secret] of Object.entries(secrets)) text = text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${secret}`);
writeFileSync(target, text, { flag: 'wx', mode: 0o600 });
console.log(`Created ${fileURLToPath(target)} with unique review credentials.`);
console.log('Run: docker compose up --build -d');
console.log('Sign in at http://localhost:3000 with SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from .env.');
