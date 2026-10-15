/** Apply only the two reviewed feed migrations after a verified production backup.
 * Uses node-postgres when the local Prisma schema-engine cannot connect to Railway.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('pg');
const root = path.resolve(__dirname, '..');
const state = process.env.LIVE_SYNC_STATE_DIR || path.join(root, '.local/live-sync');
const config = JSON.parse(fs.readFileSync(path.join(state, 'app-config.json')));
const backup = JSON.parse(fs.readFileSync(path.join(state, 'backup.json')));
if (!fs.existsSync(path.resolve(root, '..', backup.file)) || backup.bytes < 1000) throw Error('Verified production backup required');
const localDatabase = ['127.0.0.1', 'localhost'].includes(new URL(config.DATABASE_URL).hostname);
const client = new Client({ connectionString: config.DATABASE_URL, ssl: localDatabase ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, query_timeout: 120000 });
async function main() {
    await client.connect();
    for (const name of ['20261015090000_source_feed_records', '20261015100000_source_stock_codes']) {
        const sql = fs.readFileSync(path.join(root, 'prisma/migrations', name, 'migration.sql'), 'utf8');
        const checksum = crypto.createHash('sha256').update(sql).digest('hex');
        const existing = await client.query('SELECT checksum,finished_at,rolled_back_at FROM _prisma_migrations WHERE migration_name=$1', [name]);
        if (existing.rows.length) {
            if (existing.rows.length !== 1 || !existing.rows[0].finished_at || existing.rows[0].rolled_back_at || existing.rows[0].checksum !== checksum) throw Error(`Migration history requires review: ${name}`);
            console.log('Already applied', name); continue;
        }
        await client.query('BEGIN');
        try {
            await client.query("SET LOCAL lock_timeout='10s'");
            await client.query(sql);
            await client.query('INSERT INTO _prisma_migrations (id,checksum,migration_name,finished_at,applied_steps_count) VALUES ($1,$2,$3,NOW(),1)', [crypto.randomUUID(), checksum, name]);
            await client.query('COMMIT');
            console.log('Applied', name);
        } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => client.end());
