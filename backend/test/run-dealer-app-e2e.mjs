// Disposable PostgreSQL cluster: never uses the project's configured database.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const backend = dirname(dirname(fileURLToPath(import.meta.url)));
const { Client } = createRequire(import.meta.url)('pg');
const executable = name => process.env.POSTGRES_BIN ? join(process.env.POSTGRES_BIN, name) : name;
const run = (command, args, env = process.env) => execFileSync(command, args, { cwd: backend, env, encoding: 'utf8', timeout: 180_000, maxBuffer: 8 * 1024 * 1024 });
// Fail before allocating anything if PostgreSQL binaries are unavailable.
run(executable('initdb'), ['--version']);
run(executable('pg_ctl'), ['--version']);

const reserve = createServer();
await new Promise((resolve, reject) => { reserve.once('error', reject); reserve.listen(0, '127.0.0.1', resolve); });
const port = reserve.address().port;
await new Promise(resolve => reserve.close(resolve));
const directory = mkdtempSync('/tmp/changecars-dealer-app-e2e-');
const data = join(directory, 'pgdata');
let started = false;

try {
  run(executable('initdb'), ['-D', data, '--username=dealer_app_test', '--auth=trust', '--no-locale', '--encoding=UTF8']);
  run(executable('pg_ctl'), ['-D', data, '-l', join(directory, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port} -k ${directory}`, '-w', 'start']);
  started = true;
  const databaseUrl = `postgresql://dealer_app_test@127.0.0.1:${port}/dealer_app_e2e`;
  const db = new Client({ connectionString: databaseUrl.replace('/dealer_app_e2e', '/postgres') });
  try { await db.connect(); await db.query('CREATE DATABASE dealer_app_e2e'); } finally { await db.end(); }

  const env = {
    ...process.env, NODE_ENV: 'test', DATABASE_URL: databaseUrl, DATABASE_READ_URL: '', REDIS_URL: '',
    JWT_ACCESS_SECRET: 'isolated-dealer-app-e2e-secret-at-least-32-characters',
    RUN_WORKER_IN_API: 'false', SMTP_URL: '', WEB_REVALIDATE_URL: '',
    STORAGE_DRIVER: 's3', S3_ACCESS_KEY_ID: 'test-only', S3_SECRET_ACCESS_KEY: 'test-only',
    LOG_LEVEL: 'error', RATE_LIMIT_MAX: '10000', SWAGGER_ENABLED: 'true',
    DEALER_APP_E2E_DISPOSABLE: 'true', NODE_PATH: join(backend, 'node_modules'),
  };
  process.stdout.write('Applying all migrations to a new disposable PostgreSQL database...\n');
  process.stdout.write(run('npm', ['run', 'prisma:deploy'], env));
  // Exercise the GPS data migration on populated, isolated tables as well as the empty schema above.
  const gpsDb = new Client({ connectionString: databaseUrl });
  try {
    await gpsDb.connect();
    await gpsDb.query('BEGIN');
    await gpsDb.query(`CREATE TEMP TABLE branches (id text, "dealerId" text, "isHeadOffice" boolean, latitude double precision, longitude double precision);
      CREATE TEMP TABLE vehicles (id text, "branchId" text, "sourceData" jsonb, latitude double precision, longitude double precision);
      INSERT INTO branches VALUES ('missing','2523',true,NULL,NULL), ('complete','2523',true,-30,25), ('unknown','unknown',true,NULL,NULL);
      INSERT INTO vehicles VALUES ('missing','missing','{"vehicle_id":1}',NULL,NULL), ('complete','missing','{"vehicle_id":2}',-30,25), ('manual','missing','{}',NULL,NULL);`);
    const migration = readFileSync(join(backend, 'prisma/migrations/20261031000100_confirmed_dealer_gps/migration.sql'), 'utf8');
    await gpsDb.query(migration);
    await gpsDb.query(migration); // Repeat without changing already complete coordinates.
    const { rows } = await gpsDb.query(`SELECT
      (SELECT latitude IS NOT NULL FROM branches WHERE id='missing') AS filled,
      (SELECT latitude=-30 FROM branches WHERE id='complete') AS preserved,
      (SELECT latitude IS NULL FROM branches WHERE id='unknown') AS unknown,
      (SELECT latitude IS NOT NULL FROM vehicles WHERE id='missing') AS inherited,
      (SELECT latitude=-30 FROM vehicles WHERE id='complete') AS vehicle_preserved,
      (SELECT latitude IS NULL FROM vehicles WHERE id='manual') AS manual_preserved`);
    if (!Object.values(rows[0]).every(value => value === true)) throw new Error('GPS migration checks failed');
    console.log('PASS GPS migration: fills known coordinates, preserves complete/unknown/manual locations, repeat safe');
  } finally { await gpsDb.query('ROLLBACK').catch(() => {}); await gpsDb.end(); }
  const compiled = join(directory, 'compiled');
  // tsc preserves Nest's decorator metadata; esbuild/tsx does not emit that metadata.
  process.stdout.write(run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'test/tsconfig.dealer-app-e2e.json', '--outDir', compiled], env));
  process.stdout.write(run(process.execPath, [join(compiled, 'test/dealer-app.e2e.js')], env));
} catch (error) {
  if (error.stdout) process.stdout.write(String(error.stdout));
  if (error.stderr) process.stderr.write(String(error.stderr));
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
} finally {
  // Stop only the cluster initialized above; never contact a pre-existing server.
  if (started) {
    try { run(executable('pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop']); }
    catch (error) {
      process.stderr.write(`Could not stop disposable cluster: ${error.message}\n`);
      process.stderr.write(readFileSync(join(directory, 'postgres.log'), 'utf8').slice(-4000));
      process.exitCode = 1;
      started = true;
      // Preserve files if the server might still be running.
      throw error;
    }
  }
  rmSync(directory, { recursive: true, force: true });
}
