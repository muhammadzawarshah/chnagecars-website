import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PriceAlertsController, PriceAlertsService } from './price-alerts.module';

describe('price alerts API', () => {
  let app: INestApplication;
  let base: string;
  const rows = new Map<string, any>();
  const vehicles: Record<string, any> = {
    '1575860': { id: '1575860', status: 'PUBLISHED', price: 189900, specialPrice: 179900, isSpecial: true, dealer: { status: 'APPROVED' } },
    '1000001': { id: '1000001', status: 'SOLD', price: 100000, specialPrice: null, isSpecial: false, dealer: { status: 'APPROVED' } },
  };
  const db = {
    vehicle: { findUnique: jest.fn(async ({ where }: any) => vehicles[where.id] ?? null) },
    priceAlert: {
      findUnique: jest.fn(async ({ where }: any) => rows.get(`${where.vehicleId_email.vehicleId}|${where.vehicleId_email.email}`) ?? null),
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const key = `${where.vehicleId_email.vehicleId}|${where.vehicleId_email.email}`;
        const row = rows.has(key) ? Object.assign(rows.get(key), update) : { id: `alert-${rows.size + 1}`, createdAt: new Date(), ...create };
        rows.set(key, row);
        return row;
      }),
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [PriceAlertsController], providers: [PriceAlertsService, { provide: PrismaService, useValue: db }] }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
  });
  beforeEach(() => rows.clear());
  afterAll(async () => { if (app) await app.close(); });

  const send = async (body: unknown) => {
    const response = await fetch(`${base}/api/v1/price-alerts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() as any };
  };

  it('stores the sign-up with the price the person saw', async () => {
    const result = await send({ vehicleId: '1575860', name: ' Thabo Nkosi ', email: 'Thabo@Example.com', whatsappNumber: '+27 82 123 4567' });
    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ vehicleId: '1575860', priceAtSignup: 179900, duplicate: false });
    expect([...rows.values()][0]).toMatchObject({ name: 'Thabo Nkosi', email: 'thabo@example.com', whatsappNumber: '+27 82 123 4567', userId: null });
  });

  it('treats a blank WhatsApp number as not given', async () => {
    expect((await send({ vehicleId: '1575860', name: 'Thabo', email: 't@example.com', whatsappNumber: '  ' })).status).toBe(201);
    expect([...rows.values()][0].whatsappNumber).toBeNull();
  });

  it('updates instead of duplicating when the same email signs up again', async () => {
    await send({ vehicleId: '1575860', name: 'Thabo', email: 't@example.com' });
    const again = await send({ vehicleId: '1575860', name: 'Thabo N', email: 'T@example.com', whatsappNumber: '0821234567' });
    expect(again.body).toMatchObject({ duplicate: true, priceAtSignup: 179900 });
    expect(rows.size).toBe(1);
    expect([...rows.values()][0]).toMatchObject({ name: 'Thabo N', whatsappNumber: '0821234567' });
  });

  it.each([
    [{ name: 'Thabo', email: 't@example.com' }, 'vehicleId'],
    [{ vehicleId: '1575860', email: 't@example.com' }, 'name'],
    [{ vehicleId: '1575860', name: 'Thabo', email: 'not-an-email' }, 'email'],
    [{ vehicleId: '1575860', name: 'Thabo', email: 't@example.com', whatsappNumber: 'abc' }, 'whatsappNumber'],
    [{ vehicleId: '1575860', name: 'Thabo', email: 't@example.com', price: 1 }, 'price'],
  ])('rejects %j (%s)', async (body, field) => {
    const result = await send(body);
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body.details)).toContain(field);
  });

  it('returns 404 for an unknown vehicle and 409 for a sold one', async () => {
    expect((await send({ vehicleId: '9999999', name: 'Thabo', email: 't@example.com' })).status).toBe(404);
    const sold = await send({ vehicleId: '1000001', name: 'Thabo', email: 't@example.com' });
    expect(sold.status).toBe(409);
    expect(sold.body.code).toBe('VEHICLE_NOT_AVAILABLE');
    expect(rows.size).toBe(0);
  });
});
