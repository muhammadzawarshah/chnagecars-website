/** Fast, parameterized bulk media sync for an already-seeded full feed. */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync, openSync, readSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const fixture = resolve(__dirname, 'fixtures/fbook'), web = resolve(__dirname, '../../public');
const uuid = (key: string) => {
    const h = createHash('sha256').update(`changecars-fbook:${key}`).digest('hex');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
async function sync() {
    const listings = JSON.parse(readFileSync(resolve(fixture, 'listings.json'), 'utf8'));
    const manifest = JSON.parse(readFileSync(resolve(fixture, 'images.json'), 'utf8'));
    assert.equal(manifest.length, listings.reduce((n: number, r: {
        images: string[];
    }) => n + r.images.length, 0));
    const rows = manifest.map((m: {
        vehicleId: string;
        position: number;
        url?: string;
        error?: string;
    }) => {
        const url = m.error ? '/img/feed-image-unavailable.png' : m.url!;
        assert.ok(url.startsWith('/media/fbook/') || url === '/img/feed-image-unavailable.png', 'Unexpected local image path');
        const file = resolve(web, url.slice(1));
        assert.ok(existsSync(file), file);
        const h = Buffer.alloc(16), fd = openSync(file, 'r');
        try {
            readSync(fd, h, 0, 16, 0);
        }
        finally {
            closeSync(fd);
        }
        const contentType = h[0] === 0xff && h[1] === 0xd8 ? 'image/jpeg' : h[0] === 0x89 ? 'image/png' : h.toString('ascii', 0, 4) === 'RIFF' ? 'image/webp' : 'image/avif';
        return { vehicleId: uuid(`vehicle:${m.vehicleId}`), imageId: uuid(`image:${m.vehicleId}:${m.position}`), position: m.position, url, contentType, sizeBytes: statSync(file).size };
    });
    let vehicles = 0, images = 0;
    for (let start = 0; start < rows.length; start += 500) {
        const data = JSON.stringify(rows.slice(start, start + 500));
        const [v, i] = await db.$transaction([
            db.$executeRaw `UPDATE "vehicles" v SET "primaryImageUrl"=m.url, "updatedAt"=NOW()
    FROM jsonb_to_recordset(${data}::jsonb) AS m("vehicleId" uuid, position int, url text)
    WHERE v.id=m."vehicleId" AND m.position=0`,
            db.$executeRaw `UPDATE "vehicle_images" i SET url=m.url, "contentType"=m."contentType", "sizeBytes"=m."sizeBytes", "updatedAt"=NOW()
    FROM jsonb_to_recordset(${data}::jsonb) AS m("imageId" uuid, url text, "contentType" text, "sizeBytes" int)
    WHERE i.id=m."imageId"`,
        ]);
        vehicles += v;
        images += i;
    }
    assert.equal(vehicles, listings.length, 'Run the feed seed before syncing media');
    assert.equal(images, manifest.length, 'Missing image rows; run the feed seed');
    let archivedDemo = 0;
    if (process.env.ARCHIVE_SETUP_DEMO === 'true') {
        const archived = await db.vehicle.updateMany({ where: { sourceData: { equals: Prisma.DbNull }, dealer: { slug: 'sandton-auto', members: { some: { user: { email: 'owner@demo-dealer.co.za' } } } }, OR: Array.from({ length: 9 }, (_, i) => ({ slug: { endsWith: `-demo${i}` } })) }, data: { status: 'ARCHIVED', isFeatured: false } });
        archivedDemo = archived.count;
    }
    const report = { vehicles, images, downloadedImages: manifest.filter((m: {
            error?: string;
        }) => !m.error).length, placeholderImages: manifest.filter((m: {
            error?: string;
        }) => !!m.error).length, archivedDemo };
    writeFileSync(resolve(fixture, 'media-sync-report.json'), JSON.stringify(report, null, 2));
    console.log(report);
}
sync().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
