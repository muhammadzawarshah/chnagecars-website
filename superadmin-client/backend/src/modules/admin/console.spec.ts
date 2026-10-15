import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ConsoleController, ConsoleService } from './console.module';

describe('super admin console isolation', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);
  const endpoints = Object.getOwnPropertyNames(ConsoleController.prototype).filter(key => key !== 'constructor');
  const context = (method: string, role?: string) => ({
    getClass: () => ConsoleController,
    getHandler: () => (ConsoleController.prototype as any)[method],
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { id: 'admin', role } : undefined }) }),
  }) as unknown as ExecutionContext;

  it.each(endpoints)('allows only SUPER_ADMIN for %s', method => {
    expect(guard.canActivate(context(method, 'SUPER_ADMIN'))).toBe(true);
    for (const role of [undefined, 'CUSTOMER', 'DEALER', 'ADMIN']) {
      expect(() => guard.canActivate(context(method, role))).toThrow();
    }
  });

  it('settings never returns secrets or database connection details', () => {
    const config = { get: jest.fn((key: string) => key) };
    const service = new ConsoleService({} as any, config as any, {} as any, {} as any, {} as any, {} as any);
    const result = service.settings();
    expect(Object.keys(result)).toEqual(['apiPrefix', 'maxImagesPerVehicle', 'reservationHoldHours', 'biddingMaxDurationHours', 'workerInApi', 'mode']);
    expect(config.get.mock.calls.flat().join(' ')).not.toMatch(/SECRET|PASSWORD|TOKEN|DATABASE_URL|REDIS_URL|S3|SMTP/);
  });

  it('refresh preserves the immutable snapshot contract and records the actual revision', async () => {
    const manifest = { schema_version: 1, revision: 'inv-current', total: 10, snapshot_url: '/api/v1/vehicle-filters/snapshots/inv-current.json.gz', sha256: 'hash' };
    const cache = { bump: jest.fn().mockResolvedValue(undefined) };
    const snapshots = { manifest: jest.fn().mockResolvedValue(manifest) };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new ConsoleService({} as any, {} as any, snapshots as any, cache as any, audit as any, {} as any);
    expect(await service.refreshSnapshot()).toBe(manifest);
    expect(cache.bump).toHaveBeenCalledWith('vehicles');
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin.snapshot_refresh', entityId: manifest.revision }));
  });

  it('lead assignment derives dealer scope from the record and retains the real admin identity', async () => {
    const db = { lead: { findUnique: jest.fn().mockResolvedValue({ dealerId: 'dealer-a', dealer: { status: 'APPROVED' } }) } };
    const crm = { assign: jest.fn().mockResolvedValue({ id: 'lead' }) };
    const service = new ConsoleService(db as any, {} as any, {} as any, {} as any, {} as any, crm as any);
    await service.assignLead({ id: 'super-admin', role: 'SUPER_ADMIN' } as any, 'lead', { memberId: 'member' });
    expect(crm.assign).toHaveBeenCalledWith(expect.objectContaining({ userId: 'super-admin', dealerId: 'dealer-a', wideScope: true }), 'lead', { memberId: 'member' });
  });
});
