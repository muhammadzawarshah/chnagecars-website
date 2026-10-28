import { DealerTradeSyncService } from './dealertrade-sync.service';
import { CacheService } from '../cache/cache.service';

jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return { ...actual, readFileSync: jest.fn((path, ...args) =>
    String(path).endsWith('.local/dealertrade/token') ? '' : actual.readFileSync(path, ...args)) };
});

describe('DealerTrade automatic sync scheduling', () => {
  const originalEnv = { ...process.env };
  let service: DealerTradeSyncService;
  let sync: jest.SpyInstance;

  beforeEach(() => {
    process.env.DEALERTRADE_SYNC_ENABLED = 'true';
    process.env.DEALERTRADE_TOKEN = 'test-token';
    delete process.env.DEALERTRADE_SYNC_INTERVAL_MINUTES;
    service = new DealerTradeSyncService({} as CacheService);
    sync = jest.spyOn(service as any, 'sync').mockResolvedValue(undefined);
  });
  afterEach(() => { process.env = { ...originalEnv }; jest.restoreAllMocks(); });

  it('respects disablement and requires a token', async () => {
    process.env.DEALERTRADE_SYNC_ENABLED = 'false';
    await service.tick();
    process.env.DEALERTRADE_SYNC_ENABLED = 'true';
    delete process.env.DEALERTRADE_TOKEN;
    await service.tick();
    expect(sync).not.toHaveBeenCalled();
  });

  it('runs by default with a token without worker or enablement settings', async () => {
    delete process.env.DEALERTRADE_SYNC_ENABLED;
    delete process.env.RUN_WORKER_IN_API;
    service.onApplicationBootstrap();
    await service.tick();
    expect(sync).toHaveBeenCalledTimes(1);
    await service.onModuleDestroy();
  });

  it('syncs on startup and waits until the next interval', async () => {
    service.onApplicationBootstrap();
    await service.tick();
    expect(sync).toHaveBeenCalledTimes(1);
    await service.onModuleDestroy();
  });

  it('waits ten minutes between syncs by default', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    await service.tick();
    clock.mockReturnValue(now + 9 * 60_000);
    await service.tick();
    expect(sync).toHaveBeenCalledTimes(1);
    clock.mockReturnValue(now + 10 * 60_000);
    await service.tick();
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it('does not overlap a running sync even after the interval elapses', async () => {
    let finish!: () => void;
    sync.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const running = service.tick();
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 13 * 60 * 60_000);
    await service.tick();
    expect(sync).toHaveBeenCalledTimes(1);
    finish();
    await running;
    const second = service.tick();
    expect(sync).toHaveBeenCalledTimes(2);
    finish();
    await second;
  });

  it('retries failed syncs on the next interval and stops on shutdown', async () => {
    sync.mockRejectedValueOnce(new Error('upstream unavailable'));
    await service.tick();
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 13 * 60 * 60_000);
    await service.tick();
    expect(sync).toHaveBeenCalledTimes(2);
    await service.onModuleDestroy();
    await service.tick();
    expect(sync).toHaveBeenCalledTimes(2);
  });
});
