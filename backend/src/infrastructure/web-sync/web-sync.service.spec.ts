import { AppConfig } from '../../config/app-config.service';
import { WebSyncService } from './web-sync.service';

const config = (values: Record<string, string | undefined>) => ({ get: (key: string) => values[key] }) as unknown as AppConfig;

describe('WebSyncService (website refresh)', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => jest.useRealTimers());

  it('sends nothing when the website URL is not configured', async () => {
    const sync = new WebSyncService(config({ WEB_ADAPTER_KEY: 'k'.repeat(32) }));
    sync.changed('cars');
    await jest.runAllTimersAsync();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('collects quick changes into one call with the shared key', async () => {
    const sync = new WebSyncService(config({ WEB_REVALIDATE_URL: 'https://site.example/api/revalidate', WEB_ADAPTER_KEY: 'k'.repeat(32) }));
    sync.changed('cars');
    sync.changed('articles', 'cars');
    await jest.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://site.example/api/revalidate');
    expect(init.headers['x-web-adapter-key']).toBe('k'.repeat(32));
    expect(JSON.parse(init.body).tags.sort()).toEqual(['articles', 'cars']);
  });

  it('retries a website that is briefly down, but not a refused key', async () => {
    const sync = new WebSyncService(config({ WEB_REVALIDATE_URL: 'https://site.example/api/revalidate', WEB_ADAPTER_KEY: 'k'.repeat(32) }));
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce({ ok: true, status: 200 });
    sync.changed('cars');
    await jest.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockReset().mockResolvedValue({ ok: false, status: 401 });
    sync.changed('cars');
    await jest.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
