import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { FilterSnapshotsController, FilterSnapshotsService, snapshotPayload } from './filter-snapshots';

const row = { id: 'uuid', make: { slug: 'ford', name: 'Ford' }, model: { slug: 'ranger', name: 'Ranger' }, variant: null, province: 'Free State', city: 'Bethlehem', categories: [{ slug: 'bakkies', name: 'Bakkies', isActive: true }], fuelType: null, transmission: 'UNKNOWN', drivetrain: null, colour: ' White ', condition: 'USED', status: 'PUBLISHED', dealer: { slug: 'dealer', name: 'Dealer' }, price: 100, specialPrice: null, isSpecial: false, isFeatured: false, year: 2020, mileage: null, seats: null, engineCapacityCc: null, powerKw: null };
describe('immutable filter snapshots', () => {
  it('includes cylinder values and counts without zero or missing options', () => {
    const result = snapshotPayload([12, 4, 4, 0, null].map((cylinders, index) => ({ ...row, id: String(index), cylinders })));
    expect(result.options.cylinders).toEqual([{ value: 4, count: 2 }, { value: 12, count: 1 }]);
    expect(result.vehicles[4].cylinders).toBeNull();
  });
  it('adds supplier IDs while preserving existing colour dictionary keys and labels', () => {
    const result = snapshotPayload([
      { ...row, sourceData: { dealertrade: { colour_id: 15, colour: 'FROZEN WHITE' } } },
      { ...row, id: 'second', colour: 'Unknown', sourceData: { dealertrade: { colour_id: 14, colour: 'Pearl White' } } },
      { ...row, id: 'missing' },
    ]);
    expect(result.dictionaries.color).toEqual({ white: 'white', unknown: 'unknown' });
    expect(result.dictionaries.color_ids).toEqual({ white: [15], unknown: [14] });
    expect(result.vehicles.every(v => !('sourceData' in v))).toBe(true);
    expect(result.vehicles.map(v => [v.color, v.color_id])).toEqual([['white', 15], ['unknown', 14], ['white', 15]]);
  });
  it('preserves nulls and scopes relationships to dictionary entries', () => {
    const result = snapshotPayload([row]);
    expect(result.vehicles[0]).toMatchObject({ id: 'uuid', model: 'ford:ranger', city: 'free-state:bethlehem', fuel_type: null, mileage: null });
    expect(result.dictionaries.city['free-state:bethlehem']).toEqual({ name: 'Bethlehem', province_id: 'free-state' });
    expect(result.vehicles[0].body_type).toEqual(['bakkies']);
  });
  it('persists exact gzip bytes, reuses revisions, and downloads after service restart', async () => {
    let stored: any;
    const table = { findUnique: jest.fn(async ({ where }) => stored?.revision === where.revision ? stored : null), upsert: jest.fn(async ({ create }) => stored = { ...create, generatedAt: new Date('2026-10-10T00:00:00Z') }) };
    const prisma = { replica: { vehicle: { findMany: jest.fn(async () => [{ ...row }]) }, vehicleFilterSnapshot: { findFirst: jest.fn(async () => stored ?? null) } }, vehicleFilterSnapshot: table };
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
  it('serves the stored snapshot at once while a new one builds, and never loads raw source payloads', async () => {
    const previous = { revision: 'inv-' + 'a'.repeat(64), total: 44500, sha256: 'b'.repeat(64), compressedBytes: 2335278, generatedAt: new Date('2026-10-27T15:00:00Z') };
    let finishRows!: (rows: unknown[]) => void;
    const findMany = jest.fn((_args: { select: object }) => new Promise(resolve => { finishRows = resolve; }));
    const upsert = jest.fn(async ({ create }) => ({ ...create, generatedAt: new Date('2026-10-28T12:00:00Z') }));
    const prisma = { replica: { vehicle: { findMany }, vehicleFilterSnapshot: { findFirst: jest.fn(async () => previous) } }, vehicleFilterSnapshot: { findUnique: jest.fn(async () => null), upsert } };
    const cache = { versionedKey: jest.fn(async () => 'key'), get: jest.fn(async () => undefined), set: jest.fn() };
    const service = new FilterSnapshotsService(prisma as any, cache as any, { get: () => 'api/v1' } as any);
    expect(await service.manifest()).toMatchObject({ revision: previous.revision, total: 44500 });
    expect(findMany.mock.calls[0][0].select).not.toHaveProperty('sourceData');
    finishRows([{ ...row }]);
    await new Promise(resolve => setImmediate(resolve));
    const rebuilt = await service.regenerate();
    expect(rebuilt.revision).not.toBe(previous.revision);
    expect(await service.manifest()).toMatchObject({ revision: rebuilt.revision });
  });
  it('adds live DealerTrade counts to the manifest response without touching the cached manifest', async () => {
    const cached = { schema_version: 1, revision: 'inv-abc', total: 44500 };
    const source = { source: 'dealertrade', total_stock_count: 38654, last_updated: '2026-10-27 17:05:51', total: 38990, fetchedAt: new Date() };
    const controller = new FilterSnapshotsController({ manifest: jest.fn(async () => cached) } as any, { summary: jest.fn(async () => source) } as any);
    expect(await controller.manifest()).toEqual({ ...cached, source });
    expect(cached).not.toHaveProperty('source');
  });
});
