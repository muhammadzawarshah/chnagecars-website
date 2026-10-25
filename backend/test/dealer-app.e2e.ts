import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { hash } from 'bcryptjs';
import sharp from 'sharp';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { StorageService } from '../src/infrastructure/storage/storage.service';
import { DealerTradeIdentityService } from '../src/infrastructure/dealertrade/dealertrade-identity.service';
import { VehicleImagesService } from '../src/modules/vehicles/vehicle-images.service';

// The runner always creates a new cluster/database and sets this marker.
assert.equal(process.env.DEALER_APP_E2E_DISPOSABLE, 'true', 'Use npm run test:dealer-app:e2e');
assert.equal(process.env.NODE_ENV, 'test');
const target = new URL(process.env.DATABASE_URL!);
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.pathname, '/dealer_app_e2e');
assert.equal(target.username, 'dealer_app_test');

async function main() {
  const objects = new Map<string, Buffer>();
  // Only external object storage is replaced. HTTP, DI, auth, Prisma, SQL, audit and outbox are real.
  const storage = {
    presignUpload: async (key: string) => `https://storage.example.test/${key}`,
    head: async (key: string) => objects.has(key) ? { size: objects.get(key)!.length } : null,
    getBuffer: async (key: string) => objects.get(key)!,
    put: async (key: string, value: Buffer) => { objects.set(key, value); },
    delete: async (key: string) => { objects.delete(key); },
    publicUrl: (key: string) => `https://storage.example.test/${key}`,
  };
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(StorageService).useValue(storage).compile();
  const app = module.createNestApplication({ logger: false });
  const prisma = module.get(PrismaService);
  let checks = 0;
  const check = (name: string, condition: unknown) => { assert.ok(condition, name); checks++; process.stdout.write(`PASS ${name}\n`); };
  try {
    const identities = module.get(DealerTradeIdentityService);
    app.use((req: any, res: any, next: any) => identities.request(req, res, next));
    app.setGlobalPrefix('api/v1', { exclude: [{ path: 'health/live', method: RequestMethod.GET }, { path: 'health/ready', method: RequestMethod.GET }] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().addBearerAuth().build());
    SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs/openapi.json' });
    await app.listen(0, '127.0.0.1');
    const root = await app.getUrl();
    const call = async (method: string, path: string, token?: string, body?: unknown) => {
      const response = await fetch(`${root}${path.startsWith('/health/') || path.startsWith('/docs/') ? '' : '/api/v1'}${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : undefined, headers: response.headers };
    };
    const password = 'DealerAppE2ePass123';
    const passwordHash = await hash(password, 10);
    const admin = await prisma.user.create({ data: { email: 'admin@dealer-app.test', passwordHash, firstName: 'Test', lastName: 'Admin', role: 'ADMIN', emailVerifiedAt: new Date() } });
    const owner = await prisma.user.create({ data: { email: 'owner@dealer-app.test', passwordHash, firstName: 'Test', lastName: 'Owner', role: 'DEALER', emailVerifiedAt: new Date() } });
    const customer = await prisma.user.create({ data: { email: 'buyer@dealer-app.test', passwordHash, firstName: 'Test', lastName: 'Buyer', role: 'CUSTOMER', emailVerifiedAt: new Date() } });
    const dealer = await prisma.dealer.create({ data: { id: '3095', name: 'E2E Dealer A', slug: 'e2e-dealer-a', email: owner.email, phone: '+27110000001', province: 'Gauteng', city: 'Johannesburg', address: '1 Test Street', status: 'APPROVED' } });
    const other = await prisma.dealer.create({ data: { id: '4000', name: 'E2E Dealer B', slug: 'e2e-dealer-b', email: 'other@dealer-app.test', phone: '+27110000002', province: 'Gauteng', city: 'Johannesburg', address: '2 Test Street', status: 'APPROVED' } });
    await prisma.dealerMember.create({ data: { dealerId: dealer.id, userId: owner.id, role: 'OWNER' } });
    const branch = await prisma.branch.create({ data: { dealerId: other.id, name: 'Other Branch', slug: 'other', address: '2 Test Street', city: 'Johannesburg', province: 'Gauteng' } });
    const make = await prisma.make.create({ data: { name: 'Test Make', slug: 'test-make' } });
    const model = await prisma.model.create({ data: { makeId: make.id, name: 'Test Model', slug: 'test-model' } });
    const baseVehicle = { makeId: make.id, modelId: model.id, title: 'E2E Test Vehicle', condition: 'USED' as const, year: 2024, mileage: 1000, price: 100000, transmission: 'MANUAL' as const, fuelType: 'PETROL' as const, province: 'Gauteng', city: 'Johannesburg' };
    const foreign = await prisma.vehicle.create({ data: { ...baseVehicle, id: '1556378', dealerId: other.id, slug: 'foreign-car', status: 'PUBLISHED', publishedAt: new Date(), sourceData: { dealertrade: { vehicle_id: '1556378', dealer_id: other.id } } } });
    const login = async (email: string) => {
      const result = await call('POST', '/auth/login', undefined, { email, password });
      check(`existing login ${email}`, result.status === 200 && result.body.accessToken && result.body.refreshToken);
      return result.body.accessToken as string;
    };
    const adminJwt = await login(admin.email);
    const ownerJwt = await login(owner.email);
    const customerJwt = await login(customer.email);
    check('health and database connection', (await call('GET', '/health/ready')).status === 200);
    const openapi = await call('GET', '/docs/openapi.json');
    check('all dealer-app endpoints registered in real app', Object.keys(openapi.body.paths).filter(path => path.startsWith('/api/v1/dealer-app/')).length === 12);
    check('admin token endpoints registered', !!openapi.body.paths['/api/v1/admin/dealers/{dealerId}/app-tokens']);
    check('existing JWT dealer profile', (await call('GET', '/dealer/profile', ownerJwt)).body.id === dealer.id);
    check('existing auth/me JWT', (await call('GET', '/auth/me', customerJwt)).body.id === customer.id);
    const publicBefore = await call('GET', '/vehicles');
    check('existing public search still works', publicBefore.status === 200 && publicBefore.body.meta.total === 1);
    check('public cache contract', (publicBefore.headers.get('cache-control') ?? '').includes('s-maxage=60'));

    const tokenPath = `/admin/dealers/${dealer.id}/app-tokens`;
    const scopes = ['dealer:read', 'dealer:write', 'vehicles:read', 'vehicles:write'];
    check('customer cannot generate tokens', (await call('POST', tokenPath, customerJwt, { appName: 'Forbidden' })).status === 403);
    check('dealer owner cannot generate platform tokens', (await call('POST', tokenPath, ownerJwt, { appName: 'Forbidden' })).status === 403);
    const issued = await call('POST', tokenPath, adminJwt, { appName: 'E2E app', scopes });
    check('admin issues dealer token', issued.status === 201 && /^ccd_app_[A-Za-z0-9_-]{43}$/.test(issued.body.token));
    const token = issued.body.token as string;
    const stored = await prisma.dealerAppToken.findUniqueOrThrow({ where: { id: issued.body.id } });
    check('database stores only token hash', stored.tokenHash === createHash('sha256').update(token).digest('hex') && !JSON.stringify(stored).includes(token));
    check('issue response omits hash', !('tokenHash' in issued.body));
    const listed = await call('GET', tokenPath, adminJwt);
    check('token list metadata and total', listed.status === 200 && listed.body.meta.total === 1 && !JSON.stringify(listed.body).includes(token) && !JSON.stringify(listed.body).includes(stored.tokenHash));
    const readOnly = await call('POST', tokenPath, adminJwt, { appName: 'Read only' });
    check('default read-only scopes', JSON.stringify(readOnly.body.scopes) === JSON.stringify(['dealer:read', 'vehicles:read']));
    check('missing token rejected', (await call('GET', '/dealer-app/profile')).status === 401);
    check('invalid token rejected', (await call('GET', '/dealer-app/profile', 'invalid')).status === 401);
    check('user JWT cannot become app token', (await call('GET', '/dealer-app/profile', adminJwt)).status === 401);
    check('app token cannot become dealer JWT', (await call('GET', '/dealer/profile', token)).status === 401);
    check('app token cannot become admin JWT', (await call('GET', tokenPath, token)).status === 401);
    const bootstrap = await call('GET', '/dealer-app/bootstrap?pageSize=50', token);
    check('bootstrap scopes dealer and inventory', bootstrap.status === 200 && bootstrap.body.dealer.id === dealer.id && bootstrap.body.vehicles.meta.total === 0);
    check('app response never public cached', bootstrap.headers.get('cache-control') === 'private, no-store');
    check('profile read', (await call('GET', '/dealer-app/profile', token)).body.id === dealer.id);
    const updatedProfile = await call('PATCH', '/dealer-app/profile', token, { description: 'Updated by dealer app' });
    check('profile update persisted', updatedProfile.status === 200 && (await prisma.dealer.findUniqueOrThrow({ where: { id: dealer.id } })).description === 'Updated by dealer app');
    check('cannot modify dealer status', (await call('PATCH', '/dealer-app/profile', token, { status: 'APPROVED' })).status === 400);
    check('read-only profile mutation denied', (await call('PATCH', '/dealer-app/profile', readOnly.body.token, { description: 'Forbidden' })).status === 403);

    const createBody = { makeId: make.id, modelId: model.id, condition: 'USED', year: 2024, mileage: 1000, price: 100000, transmission: 'MANUAL', fuelType: 'PETROL' };
    check('read-only vehicle creation denied', (await call('POST', '/dealer-app/vehicles', readOnly.body.token, createBody)).status === 403);
    check('foreign branch denied', (await call('POST', '/dealer-app/vehicles', token, { ...createBody, branchId: branch.id })).status === 400);
    const created = await call('POST', '/dealer-app/vehicles', token, createBody);
    check('create draft vehicle', created.status === 201 && created.body.status === 'DRAFT' && created.body.dealerId === dealer.id && created.body.createdById === null);
    const id = created.body.id as string;
    const vehiclePath = `/dealer-app/vehicles/${id}`;
    check('vehicle GET', (await call('GET', vehiclePath, token)).body.id === id);
    check('list and count', (await call('GET', '/dealer-app/vehicles', token)).body.meta.total === 1);
    check('paginated inventory', (await call('GET', '/dealer-app/vehicles?page=2&pageSize=1', token)).body.data.length === 0);
    check('search inventory by text', (await call('GET', '/dealer-app/vehicles?q=Test', token)).body.meta.total === 1);
    check('invalid page size rejected', (await call('GET', '/dealer-app/vehicles?pageSize=101', token)).status === 400);
    check('dealer query override rejected', (await call('GET', '/dealer-app/vehicles?dealerId=4000', token)).status === 400);
    check('dealer body override rejected', (await call('PATCH', vehiclePath, token, { dealerId: other.id })).status === 400);
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      check(`cross-dealer ${method} denied`, (await call(method, `/dealer-app/vehicles/${foreign.id}`, token, method === 'PATCH' ? { price: 90000 } : undefined)).status === 404);
    }
    const edited = await call('PATCH', vehiclePath, token, { price: 90000, expectedVersion: created.body.version });
    check('update price and version persisted', edited.status === 200 && edited.body.price === 90000 && edited.body.version === created.body.version + 1);
    check('stale version rejected', (await call('PATCH', vehiclePath, token, { price: 80000, expectedVersion: created.body.version })).status === 409);
    check('read-only vehicle update denied', (await call('PATCH', vehiclePath, readOnly.body.token, { price: 80000 })).status === 403);
    check('read-only vehicle delete denied', (await call('DELETE', vehiclePath, readOnly.body.token)).status === 403);
    check('draft cannot publish without approval', (await call('POST', `${vehiclePath}/publish`, token)).status === 409);
    check('cannot submit without photos', (await call('POST', `${vehiclePath}/submit`, token)).status === 422);

    const jpeg = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
    const photo = await call('POST', `${vehiclePath}/images/upload-url`, token, { contentType: 'image/jpeg', sizeBytes: jpeg.length });
    check('photo upload URL', photo.status === 201 && photo.body.method === 'PUT' && photo.body.imageId);
    const image = await prisma.vehicleImage.findUniqueOrThrow({ where: { id: photo.body.imageId } });
    objects.set(image.storageKey, jpeg);
    check('foreign photo upload blocked', (await call('POST', `/dealer-app/vehicles/${foreign.id}/images/upload-url`, token, { contentType: 'image/jpeg', sizeBytes: jpeg.length })).status === 404);
    const completed = await call('POST', `${vehiclePath}/images/${image.id}/complete`, token);
    check('photo upload completion', completed.status === 201 && completed.body.status === 'PROCESSING');
    await module.get(VehicleImagesService).process(image.id);
    check('photo resizing and ready state', (await prisma.vehicleImage.findUniqueOrThrow({ where: { id: image.id } })).status === 'READY');
    const imageUpdated = await call('PATCH', `${vehiclePath}/images/${image.id}`, token, { altText: 'Front view', isPrimary: true });
    check('photo update', imageUpdated.status === 200 && imageUpdated.body.some((item: any) => item.altText === 'Front view'));
    check('photo order', (await call('PUT', `${vehiclePath}/images/order`, token, { imageIds: [image.id] })).status === 200);

    check('submit vehicle for review', (await call('POST', `${vehiclePath}/submit`, token)).body.status === 'PENDING_REVIEW');
    check('withdraw vehicle from review', (await call('POST', `${vehiclePath}/withdraw`, token)).body.status === 'DRAFT');
    check('resubmit vehicle', (await call('POST', `${vehiclePath}/submit`, token)).body.status === 'PENDING_REVIEW');
    check('existing admin approval', (await call('POST', `/admin/vehicles/${id}/approve`, adminJwt, {})).body.status === 'APPROVED');
    check('publish approved vehicle', (await call('POST', `${vehiclePath}/publish`, token)).body.status === 'PUBLISHED');
    check('published price update', (await call('PATCH', vehiclePath, token, { price: 85000 })).status === 200);
    check('published material edit blocked', (await call('PATCH', vehiclePath, token, { year: 2023 })).status === 409);
    check('existing customer feed-only visibility preserved for native inventory', !(await call('GET', '/vehicles')).body.data.some((item: any) => item.id === id));
    const publicDetail = await call('GET', `/vehicles/${foreign.id}`);
    check('existing public detail works and hides private fields', publicDetail.status === 200 && !('vin' in publicDetail.body));
    check('return to draft for material edits', (await call('POST', `${vehiclePath}/edit`, token)).body.status === 'DRAFT');
    check('draft material edit succeeds', (await call('PATCH', vehiclePath, token, { year: 2023 })).body.year === 2023);
    check('photo deletion', (await call('DELETE', `${vehiclePath}/images/${image.id}`, token)).status === 200);
    check('photo deletion persisted', await prisma.vehicleImage.count({ where: { vehicleId: id } }) === 0);
    check('vehicle delete archives', (await call('DELETE', vehiclePath, token)).body.status === 'ARCHIVED');
    check('repeated vehicle deletion safe', (await call('DELETE', vehiclePath, token)).status === 200);
    check('archive hidden from default inventory', (await call('GET', '/dealer-app/vehicles', token)).body.meta.total === 0);
    check('archive query retains history', (await call('GET', '/dealer-app/vehicles?status=ARCHIVED', token)).body.meta.total === 1);
    check('archived vehicle removed from customer search', !(await call('GET', '/vehicles')).body.data.some((item: any) => item.id === id));

    for (const status of ['PENDING_REVIEW', 'RESERVED'] as const) {
      const special = await prisma.vehicle.create({ data: { ...baseVehicle, slug: `remove-${status.toLowerCase()}`, dealerId: dealer.id, status } });
      check(`delete ${status} through lifecycle`, (await call('DELETE', `/dealer-app/vehicles/${special.id}`, token)).body.status === 'ARCHIVED');
    }
    const feed = await prisma.vehicle.create({ data: { ...baseVehicle, id: '1556517', slug: 'own-feed-car', dealerId: dealer.id, status: 'PUBLISHED', publishedAt: new Date(), sourceData: { dealertrade: { vehicle_id: '1556517', dealer_id: dealer.id } } } });
    check('existing feed listing can be edited through dealer app', (await call('PATCH', `/dealer-app/vehicles/${feed.id}`, token, { price: 95000 })).status === 200);
    check('customer app sees updated shared feed inventory', (await call('GET', '/vehicles')).body.data.some((item: any) => item.id === feed.id && item.price === 95000));
    check('existing feed listing can be removed through dealer app', (await call('DELETE', `/dealer-app/vehicles/${feed.id}`, token)).body.status === 'ARCHIVED');
    check('customer app hides archived shared feed inventory', !(await call('GET', '/vehicles')).body.data.some((item: any) => item.id === feed.id));
    const audits = await prisma.auditLog.findMany({ where: { entityId: id } });
    check('app audit identity and history persisted', audits.some(row => row.actorRole === `DEALER_APP:${stored.id}` && row.actorId === null));
    check('existing admin audit identity preserved', audits.some(row => row.action === 'vehicle.approve' && row.actorId === admin.id && row.actorRole === 'ADMIN'));
    check('secrets absent from audit payloads', !JSON.stringify(await prisma.auditLog.findMany()).includes(token));
    check('outbox events persisted', await prisma.outboxEvent.count({ where: { aggregateId: id } }) > 0);

    await prisma.dealer.update({ where: { id: dealer.id }, data: { status: 'SUSPENDED' } });
    check('suspended dealer immediately blocked', (await call('GET', '/dealer-app/profile', token)).status === 403);
    await prisma.dealer.update({ where: { id: dealer.id }, data: { status: 'APPROVED' } });
    await prisma.dealerAppToken.update({ where: { id: readOnly.body.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    check('expired token rejected', (await call('GET', '/dealer-app/profile', readOnly.body.token)).status === 401);
    check('cross-dealer token revocation rejected', (await call('DELETE', `/admin/dealers/${other.id}/app-tokens/${stored.id}`, adminJwt)).status === 404);
    check('token revoked', (await call('DELETE', `${tokenPath}/${stored.id}`, adminJwt)).status === 200);
    check('revocation immediate', (await call('GET', '/dealer-app/profile', token)).status === 401);
    check('repeated token revoke safe', (await call('DELETE', `${tokenPath}/${stored.id}`, adminJwt)).status === 200);
    check('existing dealer API still works after app mutations', (await call('GET', '/dealer/vehicles', ownerJwt)).status === 200);
    process.stdout.write(`\n${checks} real-database API checks passed. All 20 dealer-app/token method+path operations exercised.\n`);
  } finally { await app.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
