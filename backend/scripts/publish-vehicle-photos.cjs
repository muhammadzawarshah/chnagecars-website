/** Uploads the vehicle photos stored under public/media to Firebase Storage.
 *
 * Every local photo path the database references (/media/...) is uploaded once to
 * changecars/vehicles/<path after /media/>, checksum-verified, and recorded with its public
 * Firebase download URL in backend/.local/firebase/vehicle-photos.json. The run is resumable:
 * photos already in the manifest are skipped, and an object already in the bucket is reused.
 * Linking the URLs in the database is a separate step (apply-firebase-media.cjs).
 *
 *   FIREBASE_SERVICE_ACCOUNT_FILE (default backend/.secrets/firebase-service-account.json)
 *   FIREBASE_STORAGE_BUCKET       (default: <project_id>.firebasestorage.app)
 *   node scripts/publish-vehicle-photos.cjs
 */
require('dotenv/config');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('pg');

const root = path.resolve(__dirname, '../..');
const accountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE ?? path.join(root, 'backend/.secrets/firebase-service-account.json');
const account = JSON.parse(fs.readFileSync(accountFile, 'utf8'));
const bucket = process.env.FIREBASE_STORAGE_BUCKET ?? `${account.project_id}.firebasestorage.app`;
const outputDir = path.join(root, 'backend/.local/firebase');
const output = path.join(outputDir, 'vehicle-photos.json');
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 16);
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const objects = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o`;

let token, tokenExpiry = 0;
async function auth() {
    if (token && Date.now() < tokenExpiry) return token;
    const now = Math.floor(Date.now() / 1000);
    const signed = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/devstorage.read_write', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
    const assertion = `${signed}.${crypto.sign('RSA-SHA256', Buffer.from(signed), account.private_key).toString('base64url')}`;
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`Google service-account OAuth HTTP ${response.status}`);
    const data = await response.json();
    token = data.access_token; tokenExpiry = Date.now() + (data.expires_in - 120) * 1000;
    return token;
}

const contentType = (file) => /\.png$/i.test(file) ? 'image/png' : /\.webp$/i.test(file) ? 'image/webp' : /\.gif$/i.test(file) ? 'image/gif' : /\.avif$/i.test(file) ? 'image/avif' : 'image/jpeg';
const publicUrl = (name, downloadToken) => `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(name)}?alt=media&token=${encodeURIComponent(downloadToken)}`;

async function publish(local) {
    const body = fs.readFileSync(path.join(root, 'frontend/public', local));
    const name = `changecars/vehicles/${local.replace(/^\/media\//, '')}`;
    const md5 = crypto.createHash('md5').update(body).digest('base64');
    const headers = { authorization: `Bearer ${await auth()}` };
    let response = await fetch(`${objects}/${encodeURIComponent(name)}`, { headers, signal: AbortSignal.timeout(30000) });
    let metadata;
    if (response.ok) {
        metadata = await response.json();
        if (metadata.md5Hash !== md5) throw Error('Existing storage object differs from the local photo');
    } else if (response.status === 404) {
        const type = contentType(local);
        const boundary = `changecars_${crypto.randomUUID()}`;
        const info = { name, contentType: type, cacheControl: 'public, max-age=31536000, immutable', metadata: { firebaseStorageDownloadTokens: crypto.randomUUID(), source: local } };
        const payload = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(info)}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`), body, Buffer.from(`\r\n--${boundary}--\r\n`)]);
        response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=multipart&ifGenerationMatch=0`, { method: 'POST', headers: { ...headers, 'content-type': `multipart/related; boundary=${boundary}` }, body: payload, signal: AbortSignal.timeout(120000) });
        if (!response.ok) throw Error(`Upload HTTP ${response.status}`);
        metadata = await response.json();
        if (metadata.md5Hash !== md5) throw Error('Uploaded photo checksum mismatch');
    } else throw Error(`Storage metadata HTTP ${response.status}`);
    const downloadToken = metadata.metadata?.firebaseStorageDownloadTokens?.split(',')[0];
    if (!downloadToken) throw Error('Storage object has no Firebase download token');
    return { local, url: publicUrl(name, downloadToken), bytes: body.length, md5 };
}

async function main() {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    const { rows } = await db.query(`
        SELECT url AS local FROM vehicle_images WHERE url LIKE '/media/%'
        UNION SELECT "primaryImageUrl" FROM vehicles WHERE "primaryImageUrl" LIKE '/media/%'`);
    await db.end();
    const locals = rows.map((row) => row.local).sort();

    fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
    const previous = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : [];
    const done = new Map(previous.filter((row) => row.url).map((row) => [row.local, row]));
    const results = [...done.values()];
    const queue = locals.filter((local) => !done.has(local));
    console.log({ bucket, referenced: locals.length, alreadyPublished: done.size, toUpload: queue.length });

    let cursor = 0, failed = 0, lastSave = Date.now();
    const save = () => fs.writeFileSync(output, JSON.stringify(results), { mode: 0o600 });
    await auth();
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (cursor < queue.length) {
            const local = queue[cursor++];
            let result;
            for (let attempt = 0; attempt < 4 && !result?.url; attempt++) {
                try { result = await publish(local); }
                catch (error) { result = { local, error: error.message }; await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); }
            }
            if (result.url) results.push(result); else { failed++; console.error(`${local}: ${result.error}`); }
            if (Date.now() - lastSave > 5000) { save(); lastSave = Date.now(); }
            if ((cursor) % 500 === 0) console.log({ processed: cursor, of: queue.length, published: results.length, failed });
        }
    }));
    save();
    console.log({ total: locals.length, published: results.length, failed });
    if (failed) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
