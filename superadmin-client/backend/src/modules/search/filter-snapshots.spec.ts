import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { FilterSnapshotsService, snapshotPayload } from './filter-snapshots';

const row = { id: 'uuid', make: { slug: 'ford', name: 'Ford' }, model: { slug: 'ranger', name: 'Ranger' }, variant: null, province: 'FREE_STATE', city: 'Bethlehem', categories: [{ slug: 'bakkies', name: 'Bakkies', isActive: true }], fuelType: null, transmission: 'UNKNOWN', drivetrain: null, colour: ' White ', condition: 'USED', status: 'PUBLISHED', dealer: { slug: 'dealer', name: 'Dealer' }, price: 100, specialPrice: null, isSpecial: false, isFeatured: false, year: 2020, mileage: null, seats: null, engineCapacityCc: null, powerKw: null };
describe('immutable filter snapshots', () => {
  it('preserves nulls and scopes relationships to dictionary entries', () => {
    const result = snapshotPayload([row]);
    expect(result.vehicles[0]).toMatchObject({ id: 'uuid', model: 'ford:ranger', city: 'free-state:bethlehem', fuel_type: null, mileage: null });
    expect(result.dictionaries.city['free-state:bethlehem']).toEqual({ name: 'Bethlehem', province_id: 'free-state' });
    expect(result.vehicles[0].body_type).toEqual(['bakkies']);
  });
  it('persists exact gzip bytes, reuses revisions, and downloads after service restart', async () => {
    let stored: any;
    const table = { findUnique: jest.fn(async ({ where }) => stored?.revision === where.revision ? stored : null), upsert: jest.fn(async ({ create }) => stored = { ...create, generatedAt: new Date('2026-10-10T00:00:00Z') }) };
    const prisma = { replica: { vehicle: { findMany: jest.fn(async () => [{ ...row }]) } }, vehicleFilterSnapshot: table };
    const cache = { versionedKey: jest.fn(async () => 'key'), get: jest.fn(async () => undefined), set: jest.fn() };
    const config = { get: () => 'api/v1' };
    const service = new FilterSnapshotsService(prisma as any, cache as any, config as any);
    const manifest = await service.manifest();
    expect(manifest.snapshot_url).toBe(`/api/v1/vehicle-filters/snapshots/${manifest.revision}.json.gz`);
    const restarted = new FilterSnapshotsService(prisma as any, cache as any, config as any);
    const downloaded = await restarted.download(`${manifest.revision}.json.gz`);
    expect(createHash('sha256').update(downloaded.content).digest('hex')).toBe(manifest.sha256);
    expect(downloaded.content.length).toBe(manifest.compressed_bytes);
    expect(JSON.parse(gunzipSync(downloaded.content).toString()).vehicles).toHaveLength(1);
    expect((await restarted.manifest()).revision).toBe(manifest.revision);
    expect(table.upsert).toHaveBeenCalledTimes(1);
    await expect(restarted.download('inv-unknown.json.gz')).rejects.toThrow('Snapshot not found');
  });
});
