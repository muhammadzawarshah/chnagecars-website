import { Global, Injectable, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { AppConfig } from '../../config/app-config.service';

/** What changed, in the website's cache tags (frontend app/lib/backend/client.ts). */
export type WebSyncArea = 'cars' | 'articles';

const DEBOUNCE_MS = 300;
const TIMEOUT_MS = 5000;
const RETRIES = 3;

/**
 * Tells the Next.js website that public data changed, so its cached pages refresh on the next
 * visit instead of waiting for the cache to expire. Changes are collected for a moment and sent
 * as one call (POST WEB_REVALIDATE_URL with the shared WEB_ADAPTER_KEY). Failures are logged and
 * retried; they never affect the change itself, and the website's own cache expiry is the fallback.
 */
@Injectable()
export class WebSyncService implements OnModuleDestroy {
  private readonly logger = new Logger(WebSyncService.name);
  private readonly pending = new Set<WebSyncArea>();
  private timer: NodeJS.Timeout | undefined;

  constructor(private readonly config: AppConfig) {}

  get enabled(): boolean {
    return !!this.config.get('WEB_REVALIDATE_URL') && !!this.config.get('WEB_ADAPTER_KEY');
  }

  changed(...areas: WebSyncArea[]): void {
    if (!this.enabled || !areas.length) return;
    areas.forEach((area) => this.pending.add(area));
    if (!this.timer) this.timer = setTimeout(() => void this.flush(), DEBOUNCE_MS);
  }

  /** Sends what is pending now (also used on shutdown so a last change is not lost). */
  async flush(): Promise<void> {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.pending.size) return;
    const tags = [...this.pending];
    this.pending.clear();
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        const response = await fetch(this.config.get('WEB_REVALIDATE_URL')!, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-web-adapter-key': this.config.get('WEB_ADAPTER_KEY')! },
          body: JSON.stringify({ tags }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (response.ok) {
          this.logger.debug(`Website refreshed: ${tags.join(', ')}`);
          return;
        }
        // A refused key or a bad URL will not fix itself by retrying.
        if (response.status < 500) {
          this.logger.error(`Website refresh refused (${response.status}); check WEB_REVALIDATE_URL and WEB_ADAPTER_KEY`);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (attempt === RETRIES) {
          this.logger.warn(`Website refresh failed for ${tags.join(', ')} after ${RETRIES} tries: ${(error as Error).message}. Pages update when their cache expires.`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.flush();
  }
}

@Global()
@Module({ providers: [WebSyncService], exports: [WebSyncService] })
export class WebSyncModule {}
