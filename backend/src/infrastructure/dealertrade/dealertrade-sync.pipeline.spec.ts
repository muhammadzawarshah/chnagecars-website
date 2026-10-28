jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return { ...actual, readFileSync: jest.fn((path, ...args) => String(path).endsWith('apply-report.json')
    ? JSON.stringify({ created: 1, updated: 2, processed: 3, rawOnly: 0, failures: [] }) : actual.readFileSync(path, ...args)) };
});
import { DealerTradeSyncService } from './dealertrade-sync.service';
import { CacheService } from '../cache/cache.service';
import { Client } from 'pg';
import { mkdtemp, rm } from 'node:fs/promises';

jest.mock('pg', () => ({ Client: jest.fn() }));
jest.mock('node:fs/promises', () => ({ mkdtemp: jest.fn(), rm: jest.fn() }));

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
});
