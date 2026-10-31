// Local-only integration test. Isolated test accounts/apps are cleaned up afterwards.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import pg from 'pg';
const base = process.env.TEST_API_URL ?? 'http://localhost:4000/api/v1';
for (const value of [base, process.env.DATABASE_URL]) assert.ok(['localhost', '127.0.0.1'].includes(new URL(value).hostname), 'Local environments only');
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const suffix = randomUUID().slice(0, 8), appIds = [`test-a-${suffix}`, `test-b-${suffix}`];
const email = `scope-${suffix}@example.invalid`, username = `scope-${suffix}`, password = 'ScopeTest123!';
let adminToken, campaignId, checks = 0;
async function call(path, body, token, expected = 200, method = 'POST') {
  const response = await fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json().catch(() => ({}));
  assert.equal(response.status, expected, `${method} ${path}: ${response.status} ${JSON.stringify(data)}`); checks++; return data;
}
await db.connect();
try {
  adminToken = (await call('/auth/login', { email: process.env.TEST_ADMIN_EMAIL ?? 'admin@changecars.co.za', password: process.env.TEST_ADMIN_PASSWORD ?? 'LocalAdmin123' })).accessToken;
  const dealers = (await db.query("SELECT id FROM dealers WHERE status = 'APPROVED' ORDER BY id LIMIT 2")).rows;
  assert.equal(dealers.length, 2);
  for (let i = 0; i < 2; i++) await call('/admin/customer-apps', { id: appIds[i], name: `Isolation test ${i}`, dealerIds: [dealers[i].id], resetUrl: 'https://dealer.example.invalid/reset-password' }, adminToken, 201);
  const paths = ['', ...appIds.map(id => `/apps/${id}`)], accounts = [];
  for (const path of paths) accounts.push(await call(`${path}/auth/register`, { email, username, firstName: 'Scope', lastName: 'Test', password, accountType: 'DEALER' }, undefined, 201));
  const ids = accounts.map(a => a.user.id);
  assert.equal(new Set(ids).size, 3); assert.deepEqual(accounts.map(a => a.user.appId), ['changecars', ...appIds]);
  assert.equal(accounts[1].user.role, 'CUSTOMER'); assert.equal(accounts[2].user.role, 'CUSTOMER');
  await call(`${paths[1]}/auth/register`, { email, username, firstName: 'Scope', lastName: 'Test', password }, undefined, 409);
  for (let i = 0; i < 3; i++) {
    const login = await call(`${paths[i]}/auth/login`, { email, password }); assert.equal(login.user.id, ids[i]);
    assert.equal((await call(`${paths[i]}/auth/me`, undefined, login.accessToken, 200, 'GET')).id, ids[i]);
  }
  await call(`${paths[1]}/auth/me`, undefined, accounts[0].accessToken, 403, 'GET');
  await call(`${paths[2]}/auth/me`, undefined, accounts[1].accessToken, 403, 'GET');
  await call('/auth/me', undefined, accounts[1].accessToken, 403, 'GET');
  await call(`${paths[2]}/auth/refresh`, { refreshToken: accounts[1].refreshToken }, undefined, 401);
  await call(`${paths[1]}/auth/refresh`, { refreshToken: accounts[1].refreshToken });
  await call(`${paths[1]}/auth/forgot-password`, { email }, undefined, 202);
  assert.deepEqual((await db.query('SELECT "userId" FROM password_reset_tokens WHERE "userId" = ANY($1::uuid[]) AND "usedAt" IS NULL', [ids])).rows.map(r => r.userId), [ids[1]]);
  const token = randomUUID() + randomUUID();
  await db.query('INSERT INTO password_reset_tokens (id, "userId", "tokenHash", "expiresAt") VALUES ($1,$2,$3,$4)', [randomUUID(), ids[1], createHash('sha256').update(token).digest('hex'), new Date(Date.now() + 60_000)]);
  await call(`${paths[2]}/auth/reset-password`, { token, password: 'ChangedScope123!' }, undefined, 400);
  await call(`${paths[1]}/auth/reset-password`, { token, password: 'ChangedScope123!' }, undefined, 204);
  await call(`${paths[1]}/auth/login`, { email, password }, undefined, 401);
  await call(`${paths[1]}/auth/login`, { email, password: 'ChangedScope123!' });
  await call('/auth/login', { email, password }); await call(`${paths[2]}/auth/login`, { email, password });
  for (const path of ['/admin/users', '/dealer/vehicles', '/dealers/register', '/scope/1/vehicles']) await call(`${paths[1]}${path}`, undefined, undefined, 404, 'GET');
  const broadcast = await call('/admin/notifications/broadcast', { appId: appIds[0], audience: 'customers', title: 'Isolation test', body: 'Only this app should receive this.' }, adminToken, 202);
  campaignId = broadcast.campaignId; assert.equal(broadcast.recipients, 1);
  let delivered = [];
  for (let i = 0; i < 30; i++) {
    delivered = (await db.query('SELECT "userId" FROM notifications WHERE data->>\'campaignId\' = $1', [campaignId])).rows;
    if (delivered.length) break; await new Promise(resolve => setTimeout(resolve, 300));
  }
  assert.deepEqual(delivered.map(r => r.userId), [ids[1]]);
  await call(`/admin/customer-apps/${appIds[0]}/status`, { enabled: false }, adminToken, 200, 'PATCH');
  await call(`${paths[1]}/auth/login`, { email, password: 'ChangedScope123!' }, undefined, 404);
  console.log(`PASS: ${checks} HTTP checks; 3 independent same-email accounts, isolated login/reset/refresh, customer-only branded signup, app-targeted notifications and disabled-app access.`);
} finally {
  const ids = (await db.query('SELECT id FROM users WHERE email = $1', [email])).rows.map(r => r.id);
  await db.query('DELETE FROM outbox_events WHERE "aggregateId" = ANY($1::text[]) OR "aggregateId" = $2 OR "aggregateId" IN (SELECT id::text FROM notifications WHERE "userId" = ANY($3::uuid[]))', [ids, campaignId ?? '', ids]);
  await db.query('DELETE FROM audit_logs WHERE "entityId" = ANY($1::text[]) OR "entityId" = ANY($2::text[]) OR "entityId" = $3 OR "actorId" = ANY($4::uuid[])', [ids, appIds, campaignId ?? '', ids]);
  await db.query('DELETE FROM newsletter_subscribers WHERE email = $1', [email]); await db.query('DELETE FROM users WHERE email = $1', [email]);
  await db.query('DELETE FROM customer_apps WHERE id = ANY($1::text[])', [appIds]);
  if (adminToken) await fetch(`${base}/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${adminToken}` } }).catch(() => {});
  await db.end();
}
