// Reads Nest route metadata from the compiled controllers: access level, roles, dealer permissions,
// rate limits and idempotency per route. Output: access.json keyed by "METHOD /api/v1/path".
const path = require('path');
const fs = require('fs');
const root = process.argv[2];
process.chdir(root);
require(path.join(root, 'node_modules/reflect-metadata'));
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js') && !entry.name.endsWith('.spec.js')) files.push(full);
  }
})(path.join(root, 'dist/modules'));
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL', 'OPTIONS', 'HEAD', 'SEARCH'];
const out = {};
const seen = new Set();
const join = (...parts) => '/' + parts.filter(Boolean).map((p) => String(p).replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
for (const file of files) {
  let mod;
  try { mod = require(file); } catch (e) { continue; }
  for (const value of Object.values(mod)) {
    if (typeof value !== 'function' || seen.has(value)) continue;
    const classPath = Reflect.getMetadata('path', value);
    if (classPath === undefined || !Reflect.getMetadata('__controller__', value)) continue;
    seen.add(value);
    for (const name of Object.getOwnPropertyNames(value.prototype)) {
      const handler = value.prototype[name];
      if (typeof handler !== 'function' || name === 'constructor') continue;
      const routePath = Reflect.getMetadata('path', handler);
      const method = Reflect.getMetadata('method', handler);
      if (routePath === undefined || method === undefined) continue;
      const get = (key) => Reflect.getMetadata(key, handler) ?? Reflect.getMetadata(key, value);
      const isHealth = String(classPath) === 'health';
      const full = (isHealth ? '' : '/api/v1') + join(classPath, routePath).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      const throttleLimit = Reflect.getMetadata('THROTTLER:LIMITdefault', handler) ?? Reflect.getMetadata('THROTTLER:LIMITdefault', value);
      const throttleTtl = Reflect.getMetadata('THROTTLER:TTLdefault', handler) ?? Reflect.getMetadata('THROTTLER:TTLdefault', value);
      out[`${METHODS[method]} ${full === '/api/v1/' ? '/api/v1' : full}`] = {
        controller: value.name,
        public: !!get('auth:isPublic'),
        optionalAuth: !!get('auth:optional'),
        roles: get('auth:roles') ?? null,
        dealer: get('dealer:access') ?? null,
        idempotent: !!Reflect.getMetadata('idempotent', handler),
        throttle: throttleLimit ? { limit: throttleLimit, ttlMs: throttleTtl } : null,
        publicCache: get('http:publicCache') ?? null,
      };
    }
  }
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('routes', Object.keys(out).length);
