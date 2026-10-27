require('dotenv').config({ quiet: true });
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, options: '-c TimeZone=UTC' });
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const { rows } = await client.query(`
      SELECT current_database() AS database,
        (SELECT count(*)::int FROM vehicles) AS vehicles,
        (SELECT count(*)::int FROM dealers) AS dealers,
        (SELECT count(*)::int FROM source_feed_records WHERE source='dealertrade' AND kind='vehicle') AS raw_vehicles,
        (SELECT max("fetchedAt") AT TIME ZONE 'UTC' FROM source_feed_records WHERE source='dealertrade') AS last_source_update,
        (SELECT count(*)::int FROM source_feed_records WHERE source='dealertrade' AND "fetchedAt" > timezone('UTC', now()) - interval '1 hour') AS source_rows_updated_last_hour,
        (SELECT count(*)::int FROM pg_locks WHERE locktype='advisory' AND classid=193589719 AND objid=41001 AND granted) AS active_sync_locks
    `);
    await client.query('ROLLBACK');
    console.log(JSON.stringify(rows[0], null, 2));
    const response = await fetch(`http://127.0.0.1:${process.env.PORT || '4000'}/health/live`, { signal: AbortSignal.timeout(5000) });
    console.log('Backend health:', response.status, await response.text());
  } finally { await client.end(); }
}
main().catch(error => { console.error('Sync check failed:', error.code || error.message); process.exitCode = 1; });
