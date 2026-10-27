import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ClsModule, ClsService } from 'nestjs-cls';
import { createHash } from 'node:crypto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CacheHeadersInterceptor } from '../../common/interceptors/cache-headers.interceptor';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { DealerAccessGuard, DealerAccessService } from '../dealers/dealer-access';
import { DealerPortalController } from '../dealers/dealers.controller';
import { DealersService } from '../dealers/dealers.service';
import { PublicVehiclesController, DealerVehiclesController } from '../vehicles/vehicles.controller';
import { PublicVehiclesService } from '../vehicles/public-vehicles.service';
import { VehicleImagesService } from '../vehicles/vehicle-images.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { SearchService } from '../search/search.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { DealerAppTokensService } from './dealer-app-tokens.service';
import { DealerAppGuard } from './dealer-app.guard';
import { DealerAppService } from './dealer-app.service';
import { AdminDealerAppTokensController, DealerAppController } from './dealer-app.controller';

const APP_A = `ccd_app_${'a'.repeat(43)}`;
const APP_B = `ccd_app_${'b'.repeat(43)}`;
const READ_ONLY = `ccd_app_${'r'.repeat(43)}`;
const TOKEN_ID = '11111111-1111-4111-a111-111111111111';
const ADMIN_ID = '22222222-2222-4222-a222-222222222222';
const MAKE_ID = '33333333-3333-4333-a333-333333333333';
const MODEL_ID = '44444444-4444-4444-a444-444444444444';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

describe('dealer app HTTP boundary and existing app compatibility', () => {
  let server: INestApplication;
  let base: string;
  let adminJwt: string;
  let customerJwt: string;
  let tokenRows: Map<string, any>;
  let vehicleRows: any[];
  let prisma: any;
  let vehicles: VehiclesService;
  const legacyResult = { data: [{ id: '100', title: 'Existing public car' }], meta: { page: 1, pageSize: 20, total: 1, pageCount: 1 } };
  const membership = { userId: ADMIN_ID, memberId: 'member-id', dealerId: '3095', dealerStatus: 'APPROVED', role: 'OWNER', branchId: null, wideScope: true, permissions: ['INVENTORY_VIEW', 'INVENTORY_MANAGE'] };

  beforeAll(async () => {
    const matches = (row: any, where: any) => Object.entries(where).every(([key, value]) => value && typeof value === 'object' && 'in' in value ? (value.in as any[]).includes(row[key]) : row[key] === value);
    const selected = (row: any, select: any) => select ? Object.fromEntries(Object.keys(select).map(key => [key, row[key]])) : row;
    const audit = { record: jest.fn() };
    prisma = {
      dealerAppToken: {
        findUnique: jest.fn(async ({ where }: any) => tokenRows.get(where.tokenHash) ?? null),
        findFirst: jest.fn(async ({ where }: any) => [...tokenRows.values()].find(row => matches(row, where)) ?? null),
        update: jest.fn(async ({ where, data, select }: any) => {
          const row = [...tokenRows.values()].find(row => row.id === where.id);
          Object.assign(row, data); return selected(row, select);
        }),
        create: jest.fn(async ({ data, select }: any) => {
          const row = { ...data, id: TOKEN_ID, revokedAt: null, createdAt: new Date(), dealer: { id: data.dealerId, status: 'APPROVED' } };
          tokenRows.set(data.tokenHash, row); return selected(row, select);
        }),
        findMany: jest.fn(async ({ where, select }: any) => [...tokenRows.values()].filter(row => matches(row, where)).map(row => selected(row, select))),
        count: jest.fn(async ({ where }: any) => [...tokenRows.values()].filter(row => matches(row, where)).length),
      },
      dealer: {
        findUnique: jest.fn(async ({ where }: any) => ({ id: where.id, name: `Dealer ${where.id}`, branches: [] })),
        findUniqueOrThrow: jest.fn(async ({ where }: any) => ({ id: where.id, province: 'Gauteng', city: 'Johannesburg' })),
      },
      vehicle: {
        findMany: jest.fn(async ({ where, skip, take }: any) => vehicleRows.filter(row => matches(row, where)).slice(skip, skip + take)),
        count: jest.fn(async ({ where }: any) => vehicleRows.filter(row => matches(row, where)).length),
        findFirst: jest.fn(async ({ where }: any) => vehicleRows.find(row => matches(row, where)) ?? null),
        findUnique: jest.fn(async ({ where }: any) => vehicleRows.find(row => matches(row, where)) ?? null),
        findUniqueOrThrow: jest.fn(async ({ where }: any) => vehicleRows.find(row => matches(row, where))),
        create: jest.fn(async ({ data }: any) => {
          const row = { ...data, id: '103', version: 1, images: [], dealer: { status: 'APPROVED' } };
          vehicleRows.push(row); return row;
        }),
        updateMany: jest.fn(async ({ where, data }: any) => {
          const row = vehicleRows.find(row => matches(row, where));
          if (!row) return { count: 0 };
          const { version, ...fields } = data;
          Object.assign(row, fields);
          if (version?.increment) row.version += version.increment;
          return { count: 1 };
        }),
      },
      model: { findUnique: jest.fn(async () => ({ id: MODEL_ID, makeId: MAKE_ID, make: { name: 'VW' }, name: 'Polo', defaultCategoryId: null })) },
      vehicleStatusHistory: { create: jest.fn() }, vehiclePriceHistory: { create: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    vehicles = new VehiclesService(prisma, audit as any, { enqueue: jest.fn() } as any, { bump: jest.fn() } as any, {} as any);
    const module = await Test.createTestingModule({
      imports: [ClsModule.forRoot({ global: true, middleware: { mount: true } }), JwtModule.register({ global: true, secret: 'test-only-secret', signOptions: { issuer: 'changecars', audience: 'changecars-api' }, verifyOptions: { issuer: 'changecars', audience: 'changecars-api' } })],
      controllers: [DealerAppController, AdminDealerAppTokensController, PublicVehiclesController, DealerVehiclesController, DealerPortalController],
      providers: [
        DealerAppService, DealerAppTokensService, DealerAppGuard, DealerAccessGuard, JwtAuthGuard, RolesGuard,
        { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: audit },
        { provide: DealerAccessService, useValue: { resolve: jest.fn(async () => membership) } },
        { provide: DealersService, useValue: { getOwnProfile: jest.fn(async () => ({ id: '3095', name: 'Existing portal dealer' })), updateProfile: jest.fn() } },
        { provide: VehiclesService, useValue: vehicles }, { provide: VehicleImagesService, useValue: {} },
        { provide: SearchService, useValue: { search: jest.fn(async () => legacyResult) } },
        { provide: PublicVehiclesService, useValue: { withFavouriteFlags: jest.fn(async data => data), sourceSummary: jest.fn(async () => ({ source: 'dealertrade', total_stock_count: 100 })) } },
      ],
    }).compile();
    server = module.createNestApplication({ logger: false });
    server.setGlobalPrefix('api/v1');
    server.useGlobalGuards(module.get(JwtAuthGuard), module.get(RolesGuard));
    server.useGlobalInterceptors(new CacheHeadersInterceptor(module.get(Reflector)));
    server.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    server.useGlobalFilters(new AllExceptionsFilter());
    const jwt = module.get(JwtService);
    adminJwt = await jwt.signAsync({ sub: ADMIN_ID, email: 'admin@example.test', role: 'ADMIN', sid: 'session' });
    customerJwt = await jwt.signAsync({ sub: ADMIN_ID, email: 'customer@example.test', role: 'CUSTOMER', sid: 'session' });
    await server.listen(0, '127.0.0.1');
    base = await server.getUrl();
  });

  beforeEach(() => {
    tokenRows = new Map([
      [digest(APP_A), { id: TOKEN_ID, dealerId: '3095', appName: 'App A', scopes: ['dealer:read', 'dealer:write', 'vehicles:read', 'vehicles:write'], expiresAt: new Date(Date.now() + 86400000), revokedAt: null, dealer: { id: '3095', status: 'APPROVED' } }],
      [digest(APP_B), { id: 'other-token', dealerId: '4000', appName: 'App B', scopes: ['dealer:read', 'vehicles:read', 'vehicles:write'], expiresAt: new Date(Date.now() + 86400000), revokedAt: null, dealer: { id: '4000', status: 'APPROVED' } }],
      [digest(READ_ONLY), { id: 'read-token', dealerId: '3095', appName: 'Reader', scopes: ['dealer:read', 'vehicles:read'], expiresAt: new Date(Date.now() + 86400000), revokedAt: null, dealer: { id: '3095', status: 'APPROVED' } }],
    ]);
    vehicleRows = [
      { id: '100', dealerId: '3095', status: 'DRAFT', version: 1, price: 150000, specialPrice: null, isSpecial: false, images: [], dealer: { status: 'APPROVED' } },
      { id: '101', dealerId: '4000', status: 'PUBLISHED', version: 1, images: [], dealer: { status: 'APPROVED' } },
    ];
  });

  afterAll(async () => { if (server) await server.close(); });

  async function request(path: string, token?: string, method = 'GET', body?: unknown) {
    const response = await fetch(`${base}/api/v1/${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() as any, cache: response.headers.get('cache-control') };
  }

  it('keeps the existing anonymous search response and caching unchanged', async () => {
    const result = await request('vehicles');
    expect(result.status).toBe(200); expect(result.body).toMatchObject(legacyResult); expect(result.body.meta.source).toEqual({ source: 'dealertrade', total_stock_count: 100 });
    expect(result.cache).toContain('public,');
  });

  it('keeps the existing dealer JWT portal and inventory working', async () => {
    expect(await request('dealer/profile', adminJwt)).toMatchObject({ status: 200, body: { id: '3095', name: 'Existing portal dealer' } });
    const inventory = await request('dealer/vehicles', adminJwt);
    expect(inventory.status).toBe(200); expect(inventory.body.meta.total).toBe(1);
  });

  it.each([undefined, 'invalid', 'user.jwt.token'])('rejects missing/invalid app credentials: %s', async token => {
    expect((await request('dealer-app/profile', token)).status).toBe(401);
  });

  it('does not accept user/admin JWTs as dealer app credentials', async () => {
    expect((await request('dealer-app/profile', adminJwt)).status).toBe(401);
    expect((await request('dealer-app/profile', customerJwt)).status).toBe(401);
  });

  it('does not accept an app token on existing dealer/admin routes', async () => {
    expect((await request('dealer/profile', APP_A)).status).toBe(401);
    expect((await request('admin/dealers/3095/app-tokens', APP_A)).status).toBe(401);
  });

  it('returns JSON for the token’s dealer with its own inventory total, privately cached', async () => {
    const result = await request('dealer-app/bootstrap?pageSize=10', APP_A);
    expect(result.status).toBe(200); expect(result.cache).toBe('private, no-store');
    expect(result.body.dealer.id).toBe('3095'); expect(result.body.vehicles.meta.total).toBe(1);
    expect(result.body.vehicles.data.map((row: any) => row.id)).toEqual(['100']);
    const other = await request('dealer-app/bootstrap', APP_B);
    expect(other.body.dealer.id).toBe('4000');
    expect(other.body.vehicles.data.map((row: any) => row.id)).toEqual(['101']);
  });

  it.each(['GET', 'PATCH', 'DELETE'])('blocks cross-dealer vehicle %s', async method => {
    const result = await request('dealer-app/vehicles/101', APP_A, method, method === 'PATCH' ? { price: 100000 } : undefined);
    expect(result.status).toBe(404);
    expect(vehicleRows[1].status).toBe('PUBLISHED');
  });

  it('rejects dealer overrides in query/body and invalid pagination', async () => {
    expect((await request('dealer-app/vehicles?dealerId=4000', APP_A)).status).toBe(400);
    expect((await request('dealer-app/vehicles?pageSize=1000', APP_A)).status).toBe(400);
    expect((await request('dealer-app/vehicles/100', APP_A, 'PATCH', { dealerId: '4000' })).status).toBe(400);
    expect((await request('dealer-app/profile', APP_A, 'PATCH', { status: 'APPROVED' })).status).toBe(400);
  });

  it('allows reads but blocks every tested write for a read-only token', async () => {
    expect((await request('dealer-app/vehicles', READ_ONLY)).status).toBe(200);
    expect((await request('dealer-app/vehicles', READ_ONLY, 'POST', {})).status).toBe(403);
    expect((await request('dealer-app/vehicles/100', READ_ONLY, 'PATCH', { price: 100000 })).status).toBe(403);
    expect((await request('dealer-app/vehicles/100', READ_ONLY, 'DELETE')).status).toBe(403);
    expect((await request('dealer-app/profile', READ_ONLY, 'PATCH', { name: 'Changed' })).status).toBe(403);
  });

  it('creates, updates, reads and removes a vehicle through the new API', async () => {
    const created = await request('dealer-app/vehicles', APP_A, 'POST', { makeId: MAKE_ID, modelId: MODEL_ID, condition: 'USED', year: 2024, mileage: 1000, price: 100000, transmission: 'MANUAL', fuelType: 'PETROL' });
    expect(created.status).toBe(201); expect(created.body).toMatchObject({ id: '103', dealerId: '3095', status: 'DRAFT', createdById: null });
    const updated = await request('dealer-app/vehicles/103', APP_A, 'PATCH', { price: 90000, expectedVersion: 1 });
    expect(updated.status).toBe(200); expect(updated.body).toMatchObject({ price: 90000, version: 2 });
    expect((await request('dealer-app/vehicles/103', APP_A)).body.price).toBe(90000);
    const removed = await request('dealer-app/vehicles/103', APP_A, 'DELETE');
    expect(removed.status).toBe(200); expect(removed.body.status).toBe('ARCHIVED');
    expect((await request('dealer-app/vehicles/103', APP_A, 'DELETE')).status).toBe(200);
    expect(vehicleRows.find(row => row.id === '103')).toBeDefined();
    expect((await request('dealer-app/vehicles', APP_A)).body.data.map((row: any) => row.id)).not.toContain('103');
    expect((await request('dealer-app/vehicles?status=ARCHIVED', APP_A)).body.data.map((row: any) => row.id)).toEqual(['103']);
  });

  it('allows only admins to generate tokens, then revokes access immediately', async () => {
    const path = 'admin/dealers/3095/app-tokens';
    expect((await request(path, customerJwt, 'POST', { appName: 'New app' })).status).toBe(403);
    const issued = await request(path, adminJwt, 'POST', { appName: 'New app', scopes: ['dealer:read'] });
    expect(issued.status).toBe(201); expect(issued.body.token).toMatch(/^ccd_app_/);
    expect(issued.body).not.toHaveProperty('tokenHash');
    expect((await request('dealer-app/profile', issued.body.token)).status).toBe(200);
    const listed = await request(path, adminJwt);
    expect(listed.status).toBe(200); expect(JSON.stringify(listed.body)).not.toContain(issued.body.token);
    // Each fixture ID represents an independent token; select the newly issued row here.
    tokenRows.get(digest(APP_A)).id = 'different-id';
    expect((await request(`${path}/${issued.body.id}`, adminJwt, 'DELETE')).status).toBe(200);
    expect((await request('dealer-app/profile', issued.body.token)).status).toBe(401);
    expect((await request('dealer-app/profile', APP_A)).status).toBe(200);
  });

  it('rejects invalid scopes and expiry during token issuance', async () => {
    const path = 'admin/dealers/3095/app-tokens';
    expect((await request(path, adminJwt, 'POST', { appName: 'New app', scopes: ['admin:all'] })).status).toBe(400);
    expect((await request(path, adminJwt, 'POST', { appName: 'New app', expiresInDays: 0 })).status).toBe(400);
  });

  it('fails closed when an endpoint omits its scope declaration', async () => {
    const guard = server.get(DealerAppGuard);
    const context = { getHandler: () => function unscoped() {}, getClass: () => class Unscoped {}, switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: `Bearer ${APP_A}` } }) }) };
    await expect(guard.canActivate(context as any)).rejects.toMatchObject({ code: 'MISSING_APP_SCOPE' });
  });
});
