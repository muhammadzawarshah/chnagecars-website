import 'dotenv/config';
import { Client } from 'pg';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { titleCase } from '../src/common/utils/display-text';
import { standardColourName } from '../src/modules/vehicles/standard-colours';

const tables: Record<string, string[]> = {
  vehicles: ['title', 'description', 'city', 'colour'],
  dealers: ['name', 'description', 'city', 'address'],
  branches: ['name', 'city', 'address'],
  makes: ['name'], models: ['name'], variants: ['name'],
};
const apply = process.argv.includes('--apply');
const directory = resolve('.local/inventory-display', new Date().toISOString().replace(/[:.]/g, '-'));
const client = new Client({ connectionString: process.env.DATABASE_URL, options: '-c TimeZone=UTC' });
async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw Error('Local database only');
  mkdirSync(directory, { recursive: true });
  await client.connect();
  await client.query(apply ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  if (apply) {
    const lock = await client.query('SELECT pg_try_advisory_xact_lock(193589719,41001) AS acquired');
    if (!lock.rows[0].acquired) throw Error('DealerTrade sync running; wait for completion');
  }
  const report: Record<string, number> = {};
  for (const [table, fields] of Object.entries(tables)) {
    const columns = fields.map(f => `"${f}"`).join(',');
    const { rows } = await client.query(`SELECT id,${columns}${table === 'vehicles' ? ',"sourceData"' : ''} FROM ${table} ORDER BY id`);
    const changed: any[] = [], before: any[] = [];
    for (const row of rows) {
      const data: any = { id: row.id };
      for (const field of fields) data[field] = field === 'colour'
        ? standardColourName(row.sourceData?.dealertrade ?? {}, row.colour)
        : typeof row[field] === 'string' ? titleCase(row[field]) : row[field];
      if (fields.some(field => row[field] !== data[field])) {
        before.push(Object.fromEntries(['id', ...fields].map(f => [f, row[f]])));
        changed.push(data);
      }
    }
    writeFileSync(resolve(directory, `${table}-before.json`), JSON.stringify(before), { mode: 0o600 });
    report[table] = changed.length;
    if (apply && changed.length) {
      const set = fields.map(f => `"${f}"=n."${f}"`).join(',');
      const typed = fields.map(f => `"${f}" text`).join(',');
      await client.query(`UPDATE ${table} t SET ${set},"updatedAt"=timezone('UTC',now())${table === 'vehicles' ? ',version=t.version+1' : ''} FROM jsonb_to_recordset($1::jsonb) AS n(id text,${typed}) WHERE t.id::text=n.id`, [JSON.stringify(changed)]);
    }
  }
  await client.query(apply ? 'COMMIT' : 'ROLLBACK');
  writeFileSync(resolve(directory, 'report.json'), JSON.stringify({ apply, changed: report }, null, 2));
  console.log(JSON.stringify({ apply, changed: report, backup: directory }, null, 2));
}
main().catch(async error => { await client.query('ROLLBACK').catch(() => undefined); console.error(error.message); process.exitCode = 1; }).finally(() => client.end());
