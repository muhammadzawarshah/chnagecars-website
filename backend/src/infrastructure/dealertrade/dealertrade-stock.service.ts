import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { dealerTradeToken } from './dealertrade-token';
import { currentDealerScope } from '../database/dealer-scope';

const DEALERTRADE_STOCK_URL = 'https://dealertrade.co.za/api/apk/stock/by-dealers';
const SOURCE_TTL_MS = 60_000;

export type SourceSummary = { source: 'dealertrade'; total_stock_count: number | null; last_updated: string | null; total: number | null; fetchedAt: Date | null };

/**
 * Stock counts read live from the DealerTrade API (not the synced DB copy). Each call takes ~3s and the API
 * rate-limits, so one result is shared for a minute. Requests never wait for a refresh once a live result exists:
 * an older result is returned while the next one is fetched in the background. On failure the last live result
 * (or nulls) is kept.
 */
@Injectable()
export class DealerTradeStockService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DealerTradeStockService.name);
  private live?: { value: SourceSummary; at: number };
  private request?: Promise<SourceSummary>;

  /** Fetch once at startup so the first request after a deploy or restart doesn't wait either. */
  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV !== 'test' && dealerTradeToken()) void this.summary();
  }

  summary(): Promise<SourceSummary> {
    // DealerTrade's totals cover every dealer; a dealer app counts only its own listed cars.
    if (currentDealerScope()) return Promise.resolve({ source: 'dealertrade', total_stock_count: null, last_updated: this.live?.value.last_updated ?? null, total: null, fetchedAt: this.live?.value.fetchedAt ?? null });
    if (this.live) {
      if (Date.now() - this.live.at >= SOURCE_TTL_MS) void this.refresh();
      return Promise.resolve(this.live.value);
    }
    return this.refresh();
  }

  private refresh(): Promise<SourceSummary> {
    if (this.request) return this.request;
    const request = this.fetchSummary()
      .then((value) => { this.live = { value, at: Date.now() }; return value; })
      .catch((error): SourceSummary => {
        this.logger.warn(`DealerTrade stock count unavailable: ${(error as Error).message}`);
        return this.live?.value ?? { source: 'dealertrade', total_stock_count: null, last_updated: null, total: null, fetchedAt: null };
      })
      .finally(() => { this.request = undefined; });
    this.request = request;
    return request;
  }

  private async fetchSummary(): Promise<SourceSummary> {
    const token = dealerTradeToken();
    if (!token) throw new Error('DEALERTRADE_TOKEN is not set');
    const response = await fetch(`${DEALERTRADE_STOCK_URL}?page=1&per_page=1`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json() as { meta?: { total_stock_count?: unknown; last_updated?: unknown }; total?: unknown };
    const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
    return {
      source: 'dealertrade',
      total_stock_count: count(payload?.meta?.total_stock_count),
      last_updated: typeof payload?.meta?.last_updated === 'string' ? payload.meta.last_updated : null,
      total: count(payload?.total),
      fetchedAt: new Date(),
    };
  }
}
