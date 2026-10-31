// Local-only Group1 integration test. Never changes the real app configuration or dealer inventory.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import pg from 'pg';
const base = process.env.TEST_API_URL ?? 'http://localhost:4000/api/v1';
for (const value of [base, process.env.DATABASE_URL]) assert.ok(['localhost', '127.0.0.1'].includes(new URL(value).hostname), 'Local environments only');
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const suffix = randomUUID().slice(0, 8), email = `group1-${suffix}@example.invalid`, username = `group1-${suffix}`;
const password = 'ScopeTest123!', alias = '/scope/3490,3491,3493,3496', branded = '/apps/group1';
let checks = 0;
async function call(path, body, token, expected = 200, method = 'POST') {
  const response = await fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json().catch(() => ({}));
  assert.equal(response.status, expected, `${method} ${path}: ${response.status} ${JSON.stringify(data)}`); checks++; return data;
}
await db.connect();
try {
  const group = (await db.query('SELECT * FROM customer_apps WHERE id = $1', ['group1'])).rows[0];
  assert.ok(group?.enabled, 'Start the updated local API; Group1 should be provisioned automatically');
  assert.deepEqual([...group.dealerIds].sort(), ['3490', '3491', '3493', '3496']);
  const payload = { email, username, firstName: 'Scope', lastName: 'Test', password, accountType: 'DEALER' };
  const main = await call('/auth/register', payload, undefined, 201);
  const g1 = await call(`${alias}/auth/register`, payload, undefined, 201);
  assert.notEqual(main.user.id, g1.user.id);
  assert.equal(main.user.appId, 'changecars'); assert.equal(g1.user.appId, 'group1'); assert.equal(g1.user.role, 'CUSTOMER');
  await call(`${branded}/auth/register`, payload, undefined, 409);
  const login = await call(`${branded}/auth/login`, { email, password }); assert.equal(login.user.id, g1.user.id);
  const oldBaseLogin = await call('/scope/3496,3493,3491,3490/auth/login', { email, password }); assert.equal(oldBaseLogin.user.id, g1.user.id);
  assert.equal((await call(`${branded}/auth/me`, undefined, login.accessToken, 200, 'GET')).id, g1.user.id);
  assert.equal((await call(`${alias}/auth/me`, undefined, login.accessToken, 200, 'GET')).id, g1.user.id);
  await call('/auth/me', undefined, login.accessToken, 403, 'GET');
  await call(`${branded}/auth/me`, undefined, main.accessToken, 403, 'GET');
  await call('/apps/dealer-b/auth/register', payload, undefined, 404);
  const subset = await call('/scope/3490/auth/register', payload, undefined, 400); assert.equal(subset.code, 'APP_CONTEXT_REQUIRED');
  await call('/auth/refresh', { refreshToken: g1.refreshToken }, undefined, 401);
  await call(`${branded}/auth/refresh`, { refreshToken: g1.refreshToken });
  const reset = randomUUID() + randomUUID();
  await db.query('INSERT INTO password_reset_tokens (id, "userId", "tokenHash", "expiresAt") VALUES ($1,$2,$3,$4)', [randomUUID(), g1.user.id, createHash('sha256').update(reset).digest('hex'), new Date(Date.now() + 60_000)]);
  await call('/auth/reset-password', { token: reset, password: 'ChangedScope123!' }, undefined, 400);
  await call(`${alias}/auth/reset-password`, { token: reset, password: 'ChangedScope123!' }, undefined, 204);
  await call(`${branded}/auth/login`, { email, password }, undefined, 401);
  await call(`${branded}/auth/login`, { email, password: 'ChangedScope123!' });
  assert.equal((await call('/auth/login', { email, password })).user.id, main.user.id);
  console.log(`PASS: ${checks} HTTP checks; auto-configured Group1, independent same-email signup, old/new base compatibility, outsiders blocked, isolated login/refresh/reset.`);
} finally {
  const ids = (await db.query('SELECT id FROM users WHERE email = $1', [email])).rows.map(r => r.id);
  await db.query('DELETE FROM outbox_events WHERE "aggregateId" = ANY($1::text[]) OR "aggregateId" IN (SELECT id::text FROM notifications WHERE "userId" = ANY($2::uuid[]))', [ids, ids]);
  await db.query('DELETE FROM audit_logs WHERE "entityId" = ANY($1::text[]) OR "actorId" = ANY($2::uuid[])', [ids, ids]);
  await db.query('DELETE FROM newsletter_subscribers WHERE email = $1', [email]);
  await db.query('DELETE FROM users WHERE email = $1', [email]);
  await db.end();
}
