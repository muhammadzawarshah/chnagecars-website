import { DealerTradeStockService } from './dealertrade-stock.service';
import * as tokens from './dealertrade-token';

describe('DealerTradeStockService', () => {
  const live = (body: unknown, ok = true) => jest.spyOn(global, 'fetch').mockResolvedValue({ ok, status: ok ? 200 : 503, json: async () => body } as any);
  beforeEach(() => { process.env.DEALERTRADE_TOKEN = 'test-token'; });
  afterEach(() => { jest.restoreAllMocks(); delete process.env.DEALERTRADE_TOKEN; });

  it('reads separate stock and pagination counts live from the DealerTrade API without exposing arbitrary metadata', async () => {
    const fetchMock = live({ meta: { total_stock_count: 38654, last_updated: '2026-10-27 17:05:51', private: 'hidden' }, total: 38990, data: [{}] });
    const summary = await new DealerTradeStockService().summary();
    expect(summary).toEqual({ source: 'dealertrade', total_stock_count: 38654, last_updated: '2026-10-27 17:05:51', total: 38990, fetchedAt: expect.any(Date) });
    expect(fetchMock.mock.calls[0][0]).toBe('https://dealertrade.co.za/api/apk/stock/by-dealers?page=1&per_page=1');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', headers: expect.objectContaining({ authorization: 'Bearer test-token' }) });
  });
  it('returns unknown counts as null and preserves a real zero count', async () => {
    live({ meta: { total_stock_count: 0, last_updated: null }, total: -1 });
    expect(await new DealerTradeStockService().summary()).toMatchObject({ total_stock_count: 0, total: null, last_updated: null });
  });
  it('shares one live call for a minute and keeps the last live result when the API fails', async () => {
    const fetchMock = live({ meta: { total_stock_count: 38654 }, total: 38990 });
    const service = new DealerTradeStockService();
    await Promise.all([service.summary(), service.summary()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) } as any);
    expect(await service.summary()).toMatchObject({ total_stock_count: 38654 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('answers from the previous result while a stale one refreshes in the background', async () => {
    const fetchMock = live({ meta: { total_stock_count: 38654 }, total: 38990 });
    const service = new DealerTradeStockService();
    await service.summary();
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    let answer!: (value: unknown) => void;
    fetchMock.mockReturnValue(new Promise(resolve => { answer = resolve; }) as any);
    expect(await service.summary()).toMatchObject({ total_stock_count: 38654 });
    answer({ ok: true, status: 200, json: async () => ({ meta: { total_stock_count: 38526 }, total: 39049 }) });
    await new Promise(resolve => setImmediate(resolve));
    expect(await service.summary()).toMatchObject({ total_stock_count: 38526 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('returns nulls when the API has never answered', async () => {
    live({}, false);
    expect(await new DealerTradeStockService().summary()).toMatchObject({ total_stock_count: null, total: null, fetchedAt: null });
  });
  it('does not call DealerTrade without a token', async () => {
    jest.spyOn(tokens, 'dealerTradeToken').mockReturnValue('');
    const fetchMock = live({});
    expect(await new DealerTradeStockService().summary()).toMatchObject({ total_stock_count: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
