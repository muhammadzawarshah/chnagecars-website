/** Download exact dealer feed logos; only verified local images are written to dealers. */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(__dirname, '../..');
const state = resolve(root, 'backend/.local/dealertrade-reconcile');
const media = resolve(root, 'public/media/dealertrade/logos');
mkdirSync(media, { recursive: true });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 4 }) });
const rows: { dealer_id: number; dealer_name: string; dealer_image: string }[] = JSON.parse(readFileSync(resolve(state, 'source/dealers.json'), 'utf8'));
const uuid = (key: string) => {
    const h = createHash('sha256').update(`changecars-fbook:dealer:${key}`).digest('hex');
    return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
};
async function validate(bytes: Buffer) {
    const meta = await sharp(bytes, { failOn: 'error', limitInputPixels: 40000000 }).metadata();
    if (!meta.width || !meta.height || !['jpeg', 'png', 'webp', 'gif', 'avif'].includes(meta.format ?? '')) throw Error('Invalid logo image');
    await sharp(bytes, { failOn: 'error' }).stats();
    return meta.format === 'jpeg' ? 'jpg' : meta.format!;
}
async function main() {
    const dealers = await db.dealer.findMany({ select: { id: true, logoUrl: true } });
    const before = new Map(dealers.map(d => [d.id, d.logoUrl]));
    const report: { dealerId: number; id: string; source: string; local?: string; previous?: string | null; error?: string }[] = [];
    let cursor = 0;
    const stamp = Date.now();
    writeFileSync(resolve(state, `dealer-logos-before-${stamp}.json`), JSON.stringify(dealers, null, 2), { mode: 0o600 });
    await Promise.all(Array.from({ length: 4 }, async () => {
        while (cursor < rows.length) {
            const row = rows[cursor++];
            if (!row.dealer_image?.trim()) continue;
            const url = new URL(row.dealer_image, 'https://www.changecars.co.za/images/1000/');
            const item: typeof report[number] = { dealerId: row.dealer_id, id: uuid(String(row.dealer_id)), source: url.href };
            try {
                if (url.protocol !== 'https:' || url.hostname !== 'www.changecars.co.za') throw Error('Unexpected image host');
                if (!before.has(item.id)) throw Error('Dealer missing from database');
                const hash = createHash('sha256').update(url.href).digest('hex');
                let local: string | undefined;
                for (const ext of ['jpg', 'png', 'webp', 'gif', 'avif']) {
                    const file = resolve(media, `${hash}.${ext}`);
                    if (existsSync(file)) { await validate(readFileSync(file)); local = `/media/dealertrade/logos/${hash}.${ext}`; break; }
                }
                if (!local) {
                    let bytes: Buffer | undefined;
                    for (let attempt = 0; attempt < 3; attempt++) {
                        try {
                            const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: 'error' });
                            if (!response.ok) throw Error(`HTTP ${response.status}`);
                            bytes = Buffer.from(await response.arrayBuffer());
                            await validate(bytes);
                            break;
                        } catch (error) { if (attempt === 2) throw error; }
                    }
                    const ext = await validate(bytes!);
                    const file = resolve(media, `${hash}.${ext}`);
                    writeFileSync(`${file}.tmp`, bytes!);
                    renameSync(`${file}.tmp`, file);
                    local = `/media/dealertrade/logos/${hash}.${ext}`;
                }
                item.previous = before.get(item.id);
                const updated = await db.dealer.updateMany({ where: { id: item.id, logoUrl: item.previous }, data: { logoUrl: local } });
                if (updated.count !== 1) throw Error('Dealer logo changed concurrently');
                item.local = local;
            } catch (error) { item.error = error instanceof Error ? error.message : String(error); }
            report.push(item);
            writeFileSync(resolve(state, 'dealer-logos-report.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
            if (report.length % 100 === 0) console.log({ processed: report.length, downloaded: report.filter(r => r.local).length, failed: report.filter(r => r.error).length });
        }
    }));
    const successful = report.filter(r => r.local);
    const stored = await db.dealer.findMany({ where: { id: { in: successful.map(r => r.id) } }, select: { id: true, logoUrl: true } });
    const mismatches = successful.filter(r => stored.find(d => d.id === r.id)?.logoUrl !== r.local);
    console.log({ sourceDealers: rows.length, updated: successful.length, files: new Set(successful.map(r => r.local)).size, failures: report.filter(r => r.error).length, verificationMismatches: mismatches.length });
    if (mismatches.length || report.some(r => r.error)) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
