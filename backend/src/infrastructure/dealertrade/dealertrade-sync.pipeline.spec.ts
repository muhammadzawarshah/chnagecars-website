jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return { ...actual, readFileSync: jest.fn((path, ...args) => String(path).endsWith('apply-report.json')
    ? JSON.stringify({ created: 1, updated: 2, processed: 3, rawOnly: 0, failures: [] }) : actual.readFileSync(path, ...args)) };
});
import { DealerTradeSyncService } from './dealertrade-sync.service';
import { CacheService } from '../cache/cache.service';
import { Client } from 'pg';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';

jest.mock('pg', () => ({ Client: jest.fn() }));
jest.mock('node:fs/promises', () => ({ mkdtemp: jest.fn(), rm: jest.fn(), mkdir: jest.fn(), writeFile: jest.fn() }));

describe('DealerTrade automatic pipeline', () => {
  let service: DealerTradeSyncService;
  let client: { connect: jest.Mock; query: jest.Mock; end: jest.Mock; on: jest.Mock };
  let command: jest.SpyInstance;
  let bump: jest.Mock;
  const oldToken = process.env.DEALERTRADE_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DEALERTRADE_TOKEN = 'test-token';
    client = { connect: jest.fn().mockResolvedValue(undefined), query: jest.fn().mockResolvedValue({ rows: [{ acquired: true }] }), end: jest.fn().mockResolvedValue(undefined), on: jest.fn() };
    (Client as unknown as jest.Mock).mockImplementation(() => client);
    (mkdtemp as jest.Mock).mockResolvedValue('/tmp/test-dealertrade');
    (rm as jest.Mock).mockResolvedValue(undefined);
    (mkdir as jest.Mock).mockResolvedValue(undefined);
    (writeFile as jest.Mock).mockResolvedValue(undefined);
    bump = jest.fn().mockResolvedValue(undefined);
    service = new DealerTradeSyncService({ bump } as unknown as CacheService);
    command = jest.spyOn(service as any, 'command').mockResolvedValue(undefined);
  });
  afterEach(() => {
    if (oldToken === undefined) delete process.env.DEALERTRADE_TOKEN;
    else process.env.DEALERTRADE_TOKEN = oldToken;
    jest.restoreAllMocks();
  });

  it('fetches before planning, applying and verifying and refreshes public caches', async () => {
    await (service as any).sync();
    expect(command.mock.calls.map(call => call[0])).toEqual(['fetch', 'plan', 'apply', 'verify']);
    expect(command.mock.calls[0][3]).toMatchObject({ DEALERTRADE_TOKEN: 'test-token', DEALERTRADE_REMOTE_IMAGES: '1' });
    expect(bump).toHaveBeenCalledWith('vehicles', 'catalogue');
    expect(client.end).toHaveBeenCalledTimes(1);
    expect(rm).toHaveBeenCalledWith('/tmp/test-dealertrade', { recursive: true, force: true });
  });

  it('skips all API and database work when another server owns the sync lock', async () => {
    client.query.mockResolvedValue({ rows: [{ acquired: false }] });
    await (service as any).sync();
    expect(command).not.toHaveBeenCalled();
    expect(mkdtemp).not.toHaveBeenCalled();
    expect(bump).not.toHaveBeenCalled();
    expect(client.end).toHaveBeenCalled();
  });

  it('does not apply a failed fetch and retains diagnostics', async () => {
    command.mockRejectedValueOnce(new Error('fetch failed'));
    await expect((service as any).sync()).rejects.toThrow('fetch failed');
    expect(command).toHaveBeenCalledTimes(1);
    expect(bump).not.toHaveBeenCalled();
    expect(rm).not.toHaveBeenCalled();
    expect(client.end).toHaveBeenCalled();
  });

  it('invalidates caches after a partially failed apply and retains diagnostics', async () => {
    command.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('apply failed'));
    await expect((service as any).sync()).rejects.toThrow('apply failed');
    expect(command.mock.calls.map(call => call[0])).toEqual(['fetch', 'plan', 'apply']);
    expect(bump).toHaveBeenCalledWith('vehicles', 'catalogue');
    expect(rm).not.toHaveBeenCalled();
    expect(client.end).toHaveBeenCalled();
  });

  it('takes the shared write lock after fetching and before planning', async () => {
    const order: string[] = [];
    client.query.mockImplementation(async (sql: string) => { order.push(sql.includes('41002') ? 'write-lock' : 'sync-lock'); return { rows: [{ acquired: true }] }; });
    command.mockImplementation(async (stage: string) => { order.push(stage); });
    await (service as any).sync();
    expect(order).toEqual(['sync-lock', 'fetch', 'write-lock', 'plan', 'apply', 'verify']);
  });

  describe('quick sync', () => {
    const rows = [{ vehicle_id: 1577317, dealer_id: 33 }, { vehicle_id: 1577315, dealer_id: 3668 }, { vehicle_id: 1577317, dealer_id: 33 }];
    let fetchMock: jest.SpyInstance;
    beforeEach(() => {
      (mkdtemp as jest.Mock).mockResolvedValue('/tmp/test-quick');
      fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: rows }) } as Response);
    });

    it('runs the scoped pipeline on the newest page only and refreshes caches when something changed', async () => {
      await (service as any).quickSync();
      expect(String(fetchMock.mock.calls[0][0])).toBe('https://dealertrade.co.za/api/apk/stock/by-dealers?page=1');
      expect(client.query.mock.calls[0][0]).toContain('pg_try_advisory_lock(193589719, 41002)');
      expect(command.mock.calls.map(call => call[0])).toEqual(['quick plan', 'quick apply', 'quick verify']);
      expect(command.mock.calls[0][3]).toMatchObject({ DEALERTRADE_RECONCILE_SCOPE: 'source', DEALERTRADE_RECONCILE_DIR: '/tmp/test-quick', DEALERTRADE_REMOTE_IMAGES: '1' });
      const written = Object.fromEntries((writeFile as jest.Mock).mock.calls.map(([path, value]) => [String(path).split('/').pop(), value]));
      expect(JSON.parse(written['vehicles.json']).map((r: { vehicle_id: number }) => r.vehicle_id)).toEqual([1577317, 1577315]);
      expect(written['dealers.json']).toBe('[]');
      expect(JSON.parse(written['fetch-report.json'])).toMatchObject({ quick: true, uniqueVehicleRows: 2 });
      expect(bump).toHaveBeenCalledWith('vehicles', 'catalogue');
      expect(rm).toHaveBeenCalledWith('/tmp/test-quick', { recursive: true, force: true });
      expect(client.end).toHaveBeenCalled();
    });

    it('does nothing while a full sync is writing the database', async () => {
      client.query.mockResolvedValue({ rows: [{ acquired: false }] });
      await (service as any).quickSync();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(command).not.toHaveBeenCalled();
      expect(bump).not.toHaveBeenCalled();
      expect(client.end).toHaveBeenCalled();
    });

    it('waits quietly when DealerTrade is rate limiting', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 429, headers: new Headers({ 'retry-after': '120' }) } as Response);
      const now = Date.now();
      await (service as any).quickSync();
      expect(command).not.toHaveBeenCalled();
      expect(mkdtemp).not.toHaveBeenCalled();
      expect(bump).not.toHaveBeenCalled();
      expect((service as any).nextQuickRun).toBeGreaterThanOrEqual(now + 120_000);
    });

    it('stops before writing when DealerTrade fails', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 503, headers: new Headers() } as Response);
      await expect((service as any).quickSync()).rejects.toThrow('HTTP 503');
      expect(command).not.toHaveBeenCalled();
      expect(mkdtemp).not.toHaveBeenCalled();
      expect(bump).not.toHaveBeenCalled();
    });
  });
});
