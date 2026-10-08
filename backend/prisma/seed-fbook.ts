/** Repeatable import of every feed listing. Never deletes unrelated records. */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma, Province } from '../src/generated/prisma/client';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync, openSync, readSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { provinceFromName, slugify } from '../src/modules/web/web-format';
type Row = Record<string, string> & {
    address: Record<string, string>;
    mileage: {
        value: string;
        unit: string;
    };
    images: string[];
};
const root = resolve(__dirname, '../..');
const dir = resolve(__dirname, 'fixtures/fbook');
const manifest = existsSync(resolve(dir, 'images.json')) ? JSON.parse(readFileSync(resolve(dir, 'images.json'), 'utf8')) : [];
const media = new Map<string, {
    url?: string;
    error?: string;
}>(manifest.map((m: {
    vehicleId: string;
    position: number;
    url?: string;
    error?: string;
}) => [`${m.vehicleId}:${m.position}`, m]));
const rows: Row[] = JSON.parse(readFileSync(resolve(dir, 'listings.json'), 'utf8'));
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, options: '-c TimeZone=UTC' }) });
const id = (key: string) => {
    const hex = createHash('sha256').update(`changecars-fbook:${key}`).digest('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};
const integer = (value: string, label: string) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0)
        throw new Error(`Invalid ${label}: ${value}`);
    return n;
};
const mime = (file: string, fallback: string) => {
    const fd = openSync(file, 'r'), header = Buffer.alloc(16);
    try {
        readSync(fd, header, 0, 16, 0);
    }
    finally {
        closeSync(fd);
    }
    if (header[0] === 0xff && header[1] === 0xd8)
        return 'image/jpeg';
    if (header.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])))
        return 'image/png';
    if (header.toString('ascii', 0, 4) === 'RIFF')
        return 'image/webp';
    if (header.toString('ascii', 4, 8) === 'ftyp')
        return 'image/avif';
    return fallback;
};
const price = (s: string) => integer(s.replace(/\s+ZAR$/, ''), 'ZAR price');
const body = (r: Row) => {
    switch (r.body_style) {
        case 'SUV': return 'suvs';
        case 'HATCHBACK':
        case 'SMALL_CAR': return 'hatchbacks';
        case 'SALOON': return 'sedans';
        case 'COUPE': return 'coupes';
        case 'CONVERTIBLE': return 'convertibles';
        case 'VAN': return 'panel-vans';
        case 'MINIVAN': return 'mpvs';
        case 'TRUCK': return /D\/C|DOUBLE CAB/i.test(r.title) ? 'double-cabs' : /E\/C|SUPER.?CAB|EXTENDED CAB/i.test(r.title) ? 'king-cabs' : 'bakkies';
        default: return 'other';
    }
};
async function main() {
    if (!rows.length || new Set(rows.map(r => r.vehicle_id)).size !== rows.length)
        throw new Error('Empty or duplicate feed IDs');
    // Validate all rows before changing the database.
    for (const r of rows) {
        if (!provinceFromName(r.address.region))
            throw new Error(`Unknown province: ${r.address.region}`);
        if (price(r.price) <= 0)
            throw new Error(`Invalid price ${r.vehicle_id}`);
        if (r.year)
            integer(r.year, 'year');
        if (!Number.isInteger(Number(r.mileage.value)))
            throw new Error(`Invalid mileage ${r.vehicle_id}`);
        if (r.mileage.unit !== 'KM' || r.availability !== 'AVAILABLE' || !['New', 'Used', 'Demo'].includes(r.state_of_vehicle))
            throw new Error(`Unsupported feed values ${r.vehicle_id}`);
    }
    const cats = new Map<string, string>();
    for (const slug of new Set(rows.map(body))) {
        const c = await prisma.category.upsert({ where: { slug }, create: { slug, name: slug.replace(/-/g, ' ') }, update: {} });
        cats.set(slug, c.id);
    }
    const dealers = new Map<string, {
        id: string;
        branch: string;
    }>();
    for (const r of rows) {
        if (dealers.has(r.dealer_id))
            continue;
        const dealerId = id(`dealer:${r.dealer_id}`), branch = id(`branch:${r.dealer_id}`);
        const data = { name: r.dealer_name, slug: `${slugify(r.dealer_name)}-fbook-${r.dealer_id}`, phone: r.dealer_phone,
            // The feed does not supply an email. Reserved .invalid prevents accidental mail delivery.
            email: `feed-dealer-${r.dealer_id}@example.invalid`, province: provinceFromName(r.address.region) as Province,
            city: r.address.city, address: r.address.addr1, status: 'APPROVED' as const };
        await prisma.dealer.upsert({ where: { id: dealerId }, create: { id: dealerId, ...data, approvedAt: new Date() }, update: data });
        const b = { dealerId, name: r.dealer_name, slug: 'feed-head-office', phone: r.dealer_phone, address: r.address.addr1, city: r.address.city, province: data.province, isHeadOffice: true };
        await prisma.branch.upsert({ where: { id: branch }, create: { id: branch, ...b }, update: b });
        dealers.set(r.dealer_id, { id: dealerId, branch });
    }
    const catalogue = new Map<string, {
        make: string;
        model: string;
    }>();
    for (const r of rows) {
        const key = `${slugify(r.make)}:${slugify(r.model)}`;
        if (catalogue.has(key))
            continue;
        const make = await prisma.make.upsert({ where: { slug: slugify(r.make) }, create: { name: r.make, slug: slugify(r.make) }, update: {} });
        const model = await prisma.model.upsert({ where: { makeId_slug: { makeId: make.id, slug: slugify(r.model) } }, create: { makeId: make.id, name: r.model, slug: slugify(r.model) }, update: {} });
        catalogue.set(key, { make: make.id, model: model.id });
    }
    const featured = new Set(rows.slice(0, 12).map(r => r.vehicle_id));
    let done = 0, localImages = 0;
    const failures: {
        vehicleId: string;
        error: string;
    }[] = [];
    async function save(r: Row) {
        const vid = id(`vehicle:${r.vehicle_id}`), dealer = dealers.get(r.dealer_id)!, cat = catalogue.get(`${slugify(r.make)}:${slugify(r.model)}`)!;
        const imgs = r.images.map((source, i) => {
            const ext = source.split('.').pop()!.toLowerCase(), name = `${r.vehicle_id}-${i + 1}.${ext}`;
            const downloaded = media.get(`${r.vehicle_id}:${i}`);
            const asset = downloaded?.url ?? (downloaded?.error ? '/img/feed-image-unavailable.png' : `/media/fbook/${name}`);
            const actualFile = resolve(root, 'public', asset.slice(1));
            const local = existsSync(actualFile) && statSync(actualFile).size > 0;
            if (local)
                localImages++;
            return { id: id(`image:${r.vehicle_id}:${i}`), vehicleId: vid, storageKey: `fbook/${name}`, url: local ? asset : source,
                contentType: local ? mime(actualFile, 'image/jpeg') : (({ png: 'image/png', webp: 'image/webp', avif: 'image/avif' } as Record<string, string>)[ext] ?? 'image/jpeg'), sizeBytes: local ? statSync(actualFile).size : null, position: i, isPrimary: i === 0, status: 'READY' as const, altText: r.title };
        });
        const amount = price(r.price), sale = price(r.sale_price);
        const data = { dealerId: dealer.id, branchId: dealer.branch, makeId: cat.make, modelId: cat.model, stockNumber: r.vehicle_id,
            slug: `${slugify(r.title)}-fbook-${r.vehicle_id}`, title: r.title, description: r.description, year: r.year && Number(r.year) >= 1900 && Number(r.year) <= 2100 ? Number(r.year) : null,
            mileage: Number(r.mileage.value) >= 0 ? Number(r.mileage.value) : null, price: amount, specialPrice: sale > 0 && sale < amount ? sale : null, isSpecial: sale > 0 && sale < amount,
            isFeatured: featured.has(r.vehicle_id), condition: ({ New: 'NEW', Used: 'USED', Demo: 'DEMO' } as const)[r.state_of_vehicle as 'New' | 'Used' | 'Demo'], status: 'PUBLISHED' as const,
            transmission: 'UNKNOWN' as const, fuelType: 'OTHER' as const, drivetrain: null, colour: r.exterior_color,
            province: provinceFromName(r.address.region)!, city: r.address.city, primaryImageUrl: imgs[0]?.url ?? null, imageCount: imgs.length,
            sourceData: r as unknown as Prisma.InputJsonValue, categories: { set: [{ id: cats.get(body(r))! }] } };
        await prisma.$transaction(async (tx) => {
            await tx.vehicle.upsert({ where: { id: vid }, create: { id: vid, ...data, categories: { connect: [{ id: cats.get(body(r))! }] }, publishedAt: new Date() }, update: data });
            for (const img of imgs)
                await tx.vehicleImage.upsert({ where: { id: img.id }, create: img, update: img });
        });
    }
    let cursor = 0;
    await Promise.all(Array.from({ length: 8 }, async () => {
        while (cursor < rows.length) {
            const r = rows[cursor++];
            try {
                await save(r);
            }
            catch (e) {
                if (failures.length === 0)
                    console.error(e);
                failures.push({ vehicleId: r.vehicle_id, error: String(e) });
            }
            done++;
            if (done % 1000 === 0)
                console.log(`${done}/${rows.length} listings (${failures.length} errors)`);
        }
    }));
    // Opt-in replacement of the nine sample cars created during local setup.
    if (process.env.ARCHIVE_SETUP_DEMO === 'true') {
        const archived = await prisma.vehicle.updateMany({
            where: {
                sourceData: { equals: Prisma.DbNull },
                dealer: { slug: 'sandton-auto', members: { some: { user: { email: 'owner@demo-dealer.co.za' } } } },
                OR: Array.from({ length: 9 }, (_, i) => ({ slug: { endsWith: `-demo${i}` } })),
            },
            data: { status: 'ARCHIVED', isFeatured: false },
        });
        console.log(`Archived ${archived.count} setup demo listings`);
    }
    const report = { listings: rows.length, imported: rows.length - failures.length, dealers: dealers.size, localImages, remoteImages: rows.reduce((s, r) => s + r.images.length, 0) - localImages, missingYear: rows.filter(r => !r.year).length, failures };
    writeFileSync(resolve(dir, 'seed-report.json'), JSON.stringify(report, null, 2));
    console.log(report);
    if (failures.length)
        throw new Error(`${failures.length} imports failed; see seed-report.json`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
