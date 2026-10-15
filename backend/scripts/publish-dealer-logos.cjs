/** Publish validated downloaded dealer logos to the existing production Firebase bucket.
 * Uses Google's standard service-account OAuth exchange, never an application user token.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const state = path.join(root, 'backend/.local/live-sync');
const config = JSON.parse(fs.readFileSync(path.join(state, 'app-config.json')));
const account = typeof config.FIREBASE_SERVICE_ACCOUNT === 'string' ? JSON.parse(config.FIREBASE_SERVICE_ACCOUNT) : config.FIREBASE_SERVICE_ACCOUNT;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'backend/.local/dealertrade-reconcile/dealer-logos-report.json'))).filter(r => r.local);
const output = path.join(state, 'published-dealer-logos.json');
const previous = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output)) : [];
const ready = new Map(previous.filter(r => r.url && !r.error).map(r => [r.id, r]));
const results = [];
const bucket = config.FIREBASE_STORAGE_BUCKET;
const base = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o`;
const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
let token, tokenExpiry = 0;
async function auth() {
    if (token && Date.now() < tokenExpiry) return token;
    const now = Math.floor(Date.now() / 1000);
    const header = b64({ alg: 'RS256', typ: 'JWT' });
    const claims = b64({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/devstorage.read_write', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
    const signed = `${header}.${claims}`;
    const assertion = `${signed}.${crypto.sign('RSA-SHA256', Buffer.from(signed), account.private_key).toString('base64url')}`;
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`Google service-account OAuth HTTP ${response.status}`);
    const data = await response.json(); token = data.access_token; tokenExpiry = Date.now() + (data.expires_in - 120) * 1000;
    return token;
}
async function publish(row) {
    const body = fs.readFileSync(path.join(root, 'public', row.local));
    const name = `changecars/dealer-logos/${path.basename(row.local)}`;
    const md5 = crypto.createHash('md5').update(body).digest('base64');
    const metadataUrl = `${base}/${encodeURIComponent(name)}`;
    const headers = { authorization: `Bearer ${await auth()}` };
    let response = await fetch(metadataUrl, { headers, signal: AbortSignal.timeout(30000) });
    let metadata;
    if (response.ok) {
        metadata = await response.json();
        if (metadata.md5Hash !== md5) throw Error('Existing storage object differs from downloaded logo');
    } else if (response.status === 404) {
        const downloadToken = crypto.randomUUID();
        const contentType = /\.png$/i.test(row.local) ? 'image/png' : /\.webp$/i.test(row.local) ? 'image/webp' : /\.gif$/i.test(row.local) ? 'image/gif' : /\.avif$/i.test(row.local) ? 'image/avif' : 'image/jpeg';
        const boundary = `changecars_${crypto.randomUUID()}`;
        const info = { name, contentType, cacheControl: 'public, max-age=31536000, immutable', metadata: { firebaseStorageDownloadTokens: downloadToken, source: row.source } };
        const payload = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(info)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`), body, Buffer.from(`\r\n--${boundary}--\r\n`)]);
        response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=multipart&ifGenerationMatch=0`, { method: 'POST', headers: { ...headers, 'content-type': `multipart/related; boundary=${boundary}` }, body: payload, signal: AbortSignal.timeout(60000) });
        if (!response.ok) throw Error(`Logo upload HTTP ${response.status}`);
        metadata = await response.json();
        if (metadata.md5Hash !== md5) throw Error('Uploaded logo checksum mismatch');
    } else throw Error(`Storage metadata HTTP ${response.status}`);
    const downloadToken = metadata.metadata?.firebaseStorageDownloadTokens?.split(',')[0];
    if (!downloadToken) throw Error('Storage object has no Firebase download URL');
    const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(name)}?alt=media&token=${encodeURIComponent(downloadToken)}`;
    const publicResponse = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!publicResponse.ok) throw Error(`Public logo HTTP ${publicResponse.status}`);
    const remote = Buffer.from(await publicResponse.arrayBuffer());
    if (!remote.equals(body)) throw Error('Public logo differs from local image');
    return { id: row.id, dealerId: row.dealerId, source: row.source, local: row.local, url, bytes: body.length, md5 };
}
async function main() {
    await auth();
    let cursor = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
        while (cursor < manifest.length) {
            const row = manifest[cursor++];
            let result;
            if (ready.has(row.id)) result = ready.get(row.id);
            else {
                for (let attempt = 0; attempt < 3; attempt++) {
                    try { result = await publish(row); break; }
                    catch (e) { result = { id: row.id, dealerId: row.dealerId, error: e.message }; }
                }
            }
            results.push(result);
            fs.writeFileSync(output, JSON.stringify(results, null, 2), { mode: 0o600 });
            if (results.length % 100 === 0) console.log({ processed: results.length, published: results.filter(r => r.url).length, failed: results.filter(r => r.error).length });
        }
    }));
    console.log({ total: results.length, published: results.filter(r => r.url).length, failed: results.filter(r => r.error).length });
    if (results.some(r => r.error)) process.exitCode = 1;
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
