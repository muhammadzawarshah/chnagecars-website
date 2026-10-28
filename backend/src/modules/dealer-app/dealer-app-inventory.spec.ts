import { DealerAppService } from './dealer-app.service';
import type { DealerAppContext } from './dealer-app.guard';
import { VehiclesService } from '../vehicles/vehicles.service';
import { DealerStatus, VehicleStatus } from '../../generated/prisma/client';

const app: DealerAppContext = { dealerId: '3095', dealerStatus: DealerStatus.APPROVED, userId: null, branchId: null, wideScope: true, tokenId: 'token-1', appName: 'App', scopes: ['vehicles:write'] };

function fixture() {
  const prisma = {
    vehicle: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), create: jest.fn() },
    dealer: { findUnique: jest.fn().mockResolvedValue({ id: '3095', province: 'Gauteng', city: 'Johannesburg' }), findUniqueOrThrow: jest.fn().mockResolvedValue({ id: '3095', province: 'Gauteng', city: 'Johannesburg' }) },
    branch: { findFirst: jest.fn().mockResolvedValue(null) }, promotion: { findFirst: jest.fn().mockResolvedValue(null) },
    model: { findUnique: jest.fn().mockResolvedValue({ id: 'model-1', makeId: 'make-1', name: 'Polo', make: { name: 'VW' }, defaultCategoryId: null }) },
    vehicleStatusHistory: { create: jest.fn() }, $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(fn => fn(prisma));
  const vehicles = new VehiclesService(prisma as any, { record: jest.fn() } as any, { enqueue: jest.fn() } as any, { bump: jest.fn() } as any, {} as any);
  const dealers = { updateProfile: jest.fn() };
  const service = new DealerAppService(prisma as any, dealers as any, vehicles);
  return { service, prisma, vehicles, dealers };
}

describe('dealer app inventory uses existing lifecycle and tenant checks', () => {
  it('scopes list and total count to the credential’s dealer', async () => {
    const { vehicles, prisma } = fixture();
    await vehicles.listForDealer(app, { page: 2, pageSize: 10 });
    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { dealerId: '3095' }, skip: 10, take: 10 }));
    expect(prisma.vehicle.count).toHaveBeenCalledWith({ where: { dealerId: '3095' } });
  });

  it('checks ownership before reading, editing or deleting a vehicle', async () => {
    const { vehicles, prisma, service } = fixture();
    await expect(vehicles.getForDealer(app, '999')).rejects.toMatchObject({ code: 'VEHICLE_NOT_FOUND' });
    await expect(service.updateVehicle(app, '999', { price: 50000 })).rejects.toMatchObject({ code: 'VEHICLE_NOT_FOUND' });
    await expect(service.removeVehicle(app, '999')).rejects.toMatchObject({ code: 'VEHICLE_NOT_FOUND' });
    for (const [arg] of prisma.vehicle.findFirst.mock.calls) expect(arg.where).toEqual({ id: '999', dealerId: '3095' });
  });

  it('also checks dealer ownership in the lifecycle path', async () => {
    const { vehicles, prisma } = fixture();
    prisma.vehicle.findUnique.mockResolvedValue({ id: '999', dealerId: 'other', status: VehicleStatus.PUBLISHED });
    await expect(vehicles.transition('999', VehicleStatus.ARCHIVED, { type: 'dealer', userId: null, dealer: app }, { action: 'archive' })).rejects.toMatchObject({ code: 'VEHICLE_NOT_FOUND' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates draft vehicles for the bound dealer without impersonating the token issuer', async () => {
    const { service, prisma } = fixture();
    prisma.vehicle.create.mockResolvedValue({ id: 'new-id' });
    prisma.vehicle.findFirst.mockResolvedValue({ id: 'new-id', status: VehicleStatus.DRAFT });
    await service.createVehicle(app, { makeId: 'make-1', modelId: 'model-1', condition: 'USED', year: 2024, mileage: 1000, price: 100000, transmission: 'MANUAL', fuelType: 'PETROL' });
    expect(prisma.vehicle.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ dealerId: '3095', createdById: null, status: VehicleStatus.DRAFT }) }));
    expect(prisma.vehicleStatusHistory.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actorId: null }) }));
  });

  it('rejects a branch from another dealer', async () => {
    const { service, prisma } = fixture();
    await expect(service.createVehicle(app, { makeId: 'make-1', modelId: 'model-1', branchId: 'foreign-branch', condition: 'USED', year: 2024, mileage: 0, price: 100000 })).rejects.toMatchObject({ code: 'INVALID_BRANCH' });
    expect(prisma.branch.findFirst).toHaveBeenCalledWith({ where: { id: 'foreign-branch', dealerId: '3095', isActive: true } });
    expect(prisma.vehicle.create).not.toHaveBeenCalled();
  });

  it('rejects another dealer’s promotion', async () => {
    const { service, prisma } = fixture();
    await expect(service.createVehicle(app, { makeId: 'make-1', modelId: 'model-1', promotionId: 'foreign-promo', condition: 'USED', year: 2024, mileage: 0, price: 100000 })).rejects.toMatchObject({ code: 'INVALID_PROMOTION' });
    expect(prisma.promotion.findFirst).toHaveBeenCalledWith({ where: { id: 'foreign-promo', OR: [{ dealerId: '3095' }, { dealerId: null }] }, select: { id: true } });
    expect(prisma.vehicle.create).not.toHaveBeenCalled();
  });

  it('retains material-edit restrictions and optimistic concurrency', async () => {
    const { vehicles, prisma } = fixture();
    prisma.vehicle.findFirst.mockResolvedValue({ id: 'own-id', dealerId: '3095', status: VehicleStatus.PUBLISHED, version: 2 });
    await expect(vehicles.update(app, 'own-id', { year: 2025 })).rejects.toMatchObject({ code: 'MATERIAL_CHANGE_REQUIRES_REVIEW' });
    await expect(vehicles.update(app, 'own-id', { price: 90000, expectedVersion: 1 })).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    [VehicleStatus.PUBLISHED, ['archive']],
    [VehicleStatus.PENDING_REVIEW, ['withdraw', 'archive']],
    [VehicleStatus.RESERVED, ['suspend', 'archive']],
    [VehicleStatus.ARCHIVED, []],
  ])('deletes %s through the existing lifecycle', async (status, actions) => {
    const { service, vehicles } = fixture();
    jest.spyOn(vehicles, 'getForDealer').mockResolvedValue({ id: 'own-id', status } as any);
    const transitions = jest.spyOn(vehicles, 'transition').mockResolvedValue({ id: 'own-id', status: VehicleStatus.ARCHIVED } as any);
    await service.removeVehicle(app, 'own-id');
    expect(transitions.mock.calls.map(call => call[3]?.action)).toEqual(actions);
    for (const call of transitions.mock.calls) expect(call[2]).toEqual({ type: 'dealer', userId: null, dealer: app });
  });

  it('returns dealer details and paginated inventory together without an unbounded query', async () => {
    const { service, prisma } = fixture();
    const result = await service.bootstrap(app, { page: 1, pageSize: 25 });
    expect(result.dealer?.id).toBe('3095');
    expect(result.vehicles.meta).toEqual({ page: 1, pageSize: 25, total: 0, pageCount: 1 });
    expect(prisma.dealer.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: '3095' } }));
  });
});
