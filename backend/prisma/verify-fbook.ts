import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
async function verify() {
    const dir = resolve(__dirname, 'fixtures/fbook');
    const feed = JSON.parse(readFileSync(resolve(dir, 'listings.json'), 'utf8'));
    const vehicles = await db.vehicle.findMany({ select: { id: true, stockNumber: true, sourceData: true, title: true, price: true, year: true, mileage: true, primaryImageUrl: true, status: true, images: { select: { url: true } }, dealer: { select: { status: true } } } });
    const imported = vehicles.filter(v => v.sourceData && typeof v.sourceData === 'object' && 'vehicle_id' in v.sourceData);
    assert.equal(imported.length, feed.length, 'Missing/extra imported vehicles');
    const byId = new Map(imported.map(v => [v.stockNumber, v]));
    let local = 0, placeholders = 0;
    for (const row of feed) {
        const v = byId.get(row.vehicle_id);
        assert.ok(v, `Missing ${row.vehicle_id}`);
        assert.deepEqual(v.sourceData, row, `Changed original data ${row.vehicle_id}`);
        assert.equal(v.title, row.title);
        assert.equal(v.price, Number(row.price.split(' ')[0]));
        assert.equal(v.year, row.year && Number(row.year) >= 1900 && Number(row.year) <= 2100 ? Number(row.year) : null);
        assert.equal(v.mileage, Number(row.mileage.value) >= 0 ? Number(row.mileage.value) : null);
        assert.equal(v.status, 'PUBLISHED');
        assert.equal(v.dealer.status, 'APPROVED');
        assert.equal(v.images.length, row.images.length);
        for (const image of v.images) {
            if (image.url === '/img/feed-image-unavailable.png') {
                assert.ok(existsSync(resolve(__dirname, '../../public', image.url.slice(1))));
                placeholders++;
            }
            if (image.url?.startsWith('/media/fbook/')) {
                assert.ok(existsSync(resolve(__dirname, '../../public', image.url.slice(1))), image.url);
                local++;
            }
        }
    }
    const dealers = await db.dealer.count({ where: { slug: { contains: '-fbook-' } } });
    assert.equal(dealers, new Set(feed.map((r: {
        dealer_id: string;
    }) => r.dealer_id)).size);
    const result = { verifiedListings: imported.length, verifiedDealers: dealers, localImages: local, placeholderImages: placeholders, remoteImages: feed.length - local - placeholders };
    writeFileSync(resolve(dir, 'verification-report.json'), JSON.stringify(result, null, 2));
    console.log(result);
}
verify().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
