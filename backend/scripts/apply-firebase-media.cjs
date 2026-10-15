/** Points the database at the Firebase copies of vehicle photos and dealer logos.
 *
 * Reads the manifests written by publish-vehicle-photos.cjs (backend/.local/firebase/vehicle-photos.json)
 * and publish-dealer-logos.cjs (backend/.local/live-sync/published-dealer-logos.json) and replaces
 * every matching local /media/... path in vehicle_images, vehicles.primaryImageUrl and
 * dealers.logoUrl, in one transaction. The previous values are saved first so the change can be
 * undone. Only a local database is updated unless --allow-remote is passed.
 *
 *   node scripts/apply-firebase-media.cjs [--allow-remote]
 */
require('dotenv/config');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const root = path.resolve(__dirname, '..');
const photosFile = path.join(root, '.local/firebase/vehicle-photos.json');
const logosFile = path.join(root, '.local/live-sync/published-dealer-logos.json');
const backupDir = path.join(root, '.local/firebase');

function load(file) {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8')).filter((row) => row.local && row.url);
}
const firebase = (url) => new URL(url).hostname === 'firebasestorage.googleapis.com';

async function main() {
    const target = new URL(process.env.DATABASE_URL);
    if (!['127.0.0.1', 'localhost'].includes(target.hostname) && !process.argv.includes('--allow-remote')) {
        throw Error(`Refusing to update ${target.hostname}; pass --allow-remote to update a non-local database`);
    }
    const map = [...load(photosFile), ...load(logosFile)].map((row) => ({ local: row.local, url: row.url }));
    if (map.some((row) => !firebase(row.url))) throw Error('A manifest URL is not a Firebase Storage URL');
    console.log({ database: `${target.hostname}:${target.port}${target.pathname}`, mappings: map.length });

    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
        const json = JSON.stringify(map);
        const before = {
            vehicleImages: (await db.query(`SELECT id, url, "thumbnailUrl", "mediumUrl", "largeUrl" FROM vehicle_images WHERE url LIKE '/media/%' OR "thumbnailUrl" LIKE '/media/%' OR "mediumUrl" LIKE '/media/%' OR "largeUrl" LIKE '/media/%'`)).rows,
            vehicles: (await db.query(`SELECT id, "primaryImageUrl" FROM vehicles WHERE "primaryImageUrl" LIKE '/media/%'`)).rows,
            dealers: (await db.query(`SELECT id, "logoUrl" FROM dealers WHERE "logoUrl" LIKE '/media/%'`)).rows,
        };
        fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
        const backup = path.join(backupDir, `db-media-before-${Date.now()}.json`);
        fs.writeFileSync(backup, JSON.stringify(before), { mode: 0o600 });

        await db.query('BEGIN');
        await db.query('CREATE TEMP TABLE media_map (local text PRIMARY KEY, url text NOT NULL) ON COMMIT DROP');
        await db.query('INSERT INTO media_map SELECT local, url FROM jsonb_to_recordset($1::jsonb) AS r(local text, url text) ON CONFLICT DO NOTHING', [json]);
        // Columns are qualified: media_map also has a "url" column.
        const swap = (column) => `"${column}" = COALESCE((SELECT m.url FROM media_map m WHERE m.local = vi."${column}"), vi."${column}")`;
        const images = await db.query(`UPDATE vehicle_images vi SET ${['url', 'thumbnailUrl', 'mediumUrl', 'largeUrl'].map(swap).join(', ')}
            WHERE vi.url IN (SELECT local FROM media_map) OR vi."thumbnailUrl" IN (SELECT local FROM media_map) OR vi."mediumUrl" IN (SELECT local FROM media_map) OR vi."largeUrl" IN (SELECT local FROM media_map)`);
        const vehicles = await db.query(`UPDATE vehicles v SET "primaryImageUrl" = m.url FROM media_map m WHERE v."primaryImageUrl" = m.local`);
        const dealers = await db.query(`UPDATE dealers d SET "logoUrl" = m.url, "updatedAt" = NOW() FROM media_map m WHERE d."logoUrl" = m.local`);
        await db.query('COMMIT');

        const left = (await db.query(`SELECT
            (SELECT count(*) FROM vehicle_images WHERE url LIKE '/media/%')::int AS "vehicleImages",
            (SELECT count(*) FROM vehicles WHERE "primaryImageUrl" LIKE '/media/%')::int AS vehicles,
            (SELECT count(*) FROM dealers WHERE "logoUrl" LIKE '/media/%')::int AS dealers`)).rows[0];
        console.log({ backup, updated: { vehicleImages: images.rowCount, vehicles: vehicles.rowCount, dealers: dealers.rowCount }, stillLocal: left });
    } catch (error) {
        await db.query('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        await db.end();
    }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
