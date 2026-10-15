/** Batched application of the reviewed production plan, preserving absent fields.
 * Every batch is transactional; vehicle versions/dealer timestamps detect concurrent edits.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');
const { Client } = require('pg');
const root = path.resolve(__dirname, '..');
const state = process.env.LIVE_SYNC_STATE_DIR || path.join(root, '.local/live-sync');
const dir = path.join(state, 'reconcile');
const config = JSON.parse(fs.readFileSync(path.join(state, 'app-config.json')));
const plan = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json')));
const planHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, 'plan.json'))).digest('hex');
const progressFile = path.join(state, 'apply-progress.json');
const progress = fs.existsSync(progressFile) ? JSON.parse(fs.readFileSync(progressFile)) : { planHash, prepared: false, processed: 0, updated: 0, created: 0 };
if (progress.planHash !== planHash) throw Error('Plan changed since application began');
if (!fs.existsSync(path.join(state, 'backup.json'))) throw Error('Production backup required');
const localDatabase = ['127.0.0.1', 'localhost'].includes(new URL(config.DATABASE_URL).hostname);
const db = new Client({ connectionString: config.DATABASE_URL, ssl: localDatabase ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 20000, query_timeout: 180000 });
const columns = new Map();
const quote = name => '"' + name.replaceAll('"', '""') + '"';
function fields(table, names) {
    const allowed = columns.get(table);
    if (!allowed || names.some(n => !allowed.has(n))) throw Error(`Unknown column for ${table}`);
    return names.map(quote);
}
async function create(table, records) {
    const groups = new Map();
    for (const input of records) {
        const data = { ...input };
        if (columns.get(table).has('id') && !data.id) data.id = crypto.randomUUID();
        if (columns.get(table).has('updatedAt') && !data.updatedAt) data.updatedAt = new Date().toISOString();
        const key = Object.keys(data).sort().join(',');
        const group = groups.get(key) || []; group.push(data); groups.set(key, group);
    }
    for (const [key, data] of groups) {
        const keys = fields(table, key.split(','));
        await db.query(`INSERT INTO ${quote(table)} (${keys.join(',')}) SELECT ${keys.map(k => 'r.' + k).join(',')} FROM jsonb_populate_recordset(NULL::${quote(table)},$1::jsonb) r`, [JSON.stringify(data)]);
    }
}
async function update(table, rows, guard) {
    rows = rows.filter(r => Object.keys(r.patch).length);
    if (!rows.length) return;
    const names = [...new Set(rows.flatMap(r => Object.keys(r.patch)))];
    const keys = fields(table, names);
    if (names.some(n => ['id', 'version', 'createdAt', 'updatedAt'].includes(n))) throw Error('Protected field in patch');
    const payload = rows.map(r => ({ id: r.id, patch: r.patch, expected: guard === 'version' ? r.before.version : r.before.updatedAt }));
    const predicate = guard === 'version' ? `AND t.version=(j->>'expected')::int` : guard === 'updatedAt' ? `AND t."updatedAt"=(j->>'expected')::timestamp` : '';
    const stamp = columns.get(table).has('updatedAt') ? ',"updatedAt"=NOW()' : '';
    const idColumn = table === 'variant_specifications' ? 'variantId' : 'id';
    const result = await db.query(`UPDATE ${quote(table)} t SET (${keys.join(',')})=(SELECT ${keys.map(k => 'r.' + k).join(',')} FROM jsonb_populate_record(t,j->'patch') r)${guard === 'version' ? ',version=t.version+1' : ''}${stamp} FROM jsonb_array_elements($1::jsonb) j WHERE t.${quote(idColumn)}=(j->>'id')::uuid ${predicate}`, [JSON.stringify(payload)]);
    if (result.rowCount !== rows.length) throw Error(`Concurrent edit/missing row in ${table}: expected ${rows.length}, changed ${result.rowCount}`);
}
async function raw(kind, rows) {
    if (!rows.length) return;
    await db.query(`INSERT INTO source_feed_records (source,kind,"externalId",payload,"fetchedAt") SELECT 'dealertrade',$1,r."externalId",r.payload,NOW() FROM jsonb_to_recordset($2::jsonb) r("externalId" text,payload jsonb) ON CONFLICT (source,kind,"externalId") DO UPDATE SET payload=EXCLUDED.payload,"fetchedAt"=NOW()`, [kind, JSON.stringify(rows.map(r => ({ externalId: r.externalId, payload: r.payload })))]);
}
async function transaction(task) {
    await db.query('BEGIN');
    try { await db.query("SET LOCAL lock_timeout='15s'"); await task(); await db.query('COMMIT'); }
    catch (e) { await db.query('ROLLBACK'); throw e; }
}
const save = () => fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2), { mode: 0o600 });
async function main() {
    const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, 'source/vehicles.json'))).digest('hex');
    if (sourceHash !== plan.capture.vehiclesSha256) throw Error('Source capture changed after plan');
    await db.connect();
    const schema = await db.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'");
    for (const r of schema.rows) { if (!columns.has(r.table_name)) columns.set(r.table_name, new Set()); columns.get(r.table_name).add(r.column_name); }
    if (!progress.prepared) {
        await transaction(async () => {
            for (const [kind, table] of [['make', 'makes'], ['model', 'models']]) {
                const rows = plan.catalogue.filter(r => r.kind === kind);
                await create(table, rows.filter(r => !r.before).map(r => r.data));
                await update(table, rows.filter(r => r.before).map(r => ({ ...r, patch: r.data })));
            }
            await create('dealers', plan.dealerPlans.filter(r => !r.before).map(r => r.create));
            await update('dealers', plan.dealerPlans.filter(r => r.before), 'updatedAt');
            await create('branches', plan.dealerPlans.map(r => r.branch).filter(r => !r.before).map(r => r.create));
            await update('branches', plan.dealerPlans.map(r => r.branch).filter(r => r.before));
            await raw('dealer', plan.dealerPlans);
            await create('variants', plan.variantPlans.filter(r => r.create).map(r => r.create));
            await update('variants', plan.variantPlans.filter(r => !r.create));
            await create('variant_specifications', plan.variantPlans.filter(r => !r.specBefore).map(r => ({ variantId: r.id, ...r.specPatch })));
            await update('variant_specifications', plan.variantPlans.filter(r => r.specBefore).map(r => ({ id: r.id, before: r.specBefore, patch: r.specPatch })));
        });
        progress.prepared = true; save(); console.log('Catalogue, dealers, branches and variant specifications synchronized');
    }
    let batch = [], seen = 0;
    const resumeAfter = progress.processed;
    async function applyBatch() {
        const current = batch; batch = [];
        await transaction(async () => {
            await create('vehicles', current.filter(r => !r.before).map(r => r.create));
            await update('vehicles', current.filter(r => r.before), 'version');
            const categoryRows = current.filter(r => r.categories);
            if (categoryRows.length) {
                await db.query('DELETE FROM "_CategoryToVehicle" WHERE "B"=ANY($1::uuid[])', [categoryRows.map(r => r.id)]);
                const pairs = categoryRows.flatMap(r => r.categories.map(id => ({ A: id, B: r.id })));
                if (pairs.length) await db.query('INSERT INTO "_CategoryToVehicle" ("A","B") SELECT r."A",r."B" FROM jsonb_to_recordset($1::jsonb) r("A" uuid,"B" uuid) ON CONFLICT DO NOTHING', [JSON.stringify(pairs)]);
            }
            const galleries = current.filter(r => r.gallery);
            const images = galleries.flatMap(r => r.gallery);
            if (images.length) await db.query(`INSERT INTO vehicle_images (id,"vehicleId","storageKey",url,"sizeBytes","contentType",position,"isPrimary",status,"updatedAt") SELECT i.id,i."vehicleId",i."storageKey",i.url,i."sizeBytes",i."contentType",i.position,i."isPrimary",'READY'::"ImageStatus",NOW() FROM jsonb_to_recordset($1::jsonb) i(id uuid,"vehicleId" uuid,"storageKey" text,url text,"sizeBytes" int,"contentType" text,position int,"isPrimary" boolean) ON CONFLICT ("storageKey") DO UPDATE SET url=EXCLUDED.url,"sizeBytes"=EXCLUDED."sizeBytes","contentType"=EXCLUDED."contentType",position=EXCLUDED.position,"isPrimary"=EXCLUDED."isPrimary","updatedAt"=NOW()`, [JSON.stringify(images)]);
            if (galleries.length) await db.query(`DELETE FROM vehicle_images i USING jsonb_to_recordset($1::jsonb) r(id uuid,external text,count int) WHERE i."vehicleId"=r.id AND (i."storageKey" LIKE 'fbook/'||r.external||'-%' OR (i."storageKey" LIKE 'dealertrade/'||r.external||'/%' AND i.position>=r.count))`, [JSON.stringify(galleries.map(r => ({ id: r.id, external: r.externalId, count: r.gallery.length })))]);
            await raw('vehicle', current);
        });
        progress.processed += current.length;
        progress.created += current.filter(r => !r.before).length;
        progress.updated += current.filter(r => r.before && Object.keys(r.patch).length).length;
        save(); console.log({ processed: progress.processed, updated: progress.updated, created: progress.created });
    }
    for await (const line of readline.createInterface({ input: fs.createReadStream(path.join(dir, plan.vehiclePlansFile)), crlfDelay: Infinity })) {
        if (!line) continue;
        if (seen++ < resumeAfter) continue;
        batch.push(JSON.parse(line));
        if (batch.length >= 500) await applyBatch();
    }
    if (batch.length) await applyBatch();
    await transaction(() => raw('vehicle', plan.rawOnly));
    const report = { at: new Date().toISOString(), ...progress, rawOnly: plan.rawOnly.length, failures: [] };
    fs.writeFileSync(path.join(dir, 'apply-report.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log('Production API reconciliation complete', report);
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.end());
