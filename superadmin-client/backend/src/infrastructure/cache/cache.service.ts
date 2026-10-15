import { Global, Inject, Injectable, Logger, Module } from '@nestjs/common';
import { REDIS, RedisClient } from '../redis/redis.module';
import { WebSyncArea, WebSyncService } from '../web-sync/web-sync.service';

/**
 * Cache-aside helper. Cache is never the source of truth: on authoritative updates
 * callers bump the namespace version, which makes every key in that namespace stale.
 * TTLs are only a safety net. Redis failures degrade to a cache miss, never to an error.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, { value: string; expiresAt: number }>();
  private readonly prefix = 'cc:';

  constructor(
    @Inject(REDIS) private readonly redis: RedisClient,
    private readonly webSync: WebSyncService,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const raw = this.redis ? await this.redis.get(this.prefix + key) : this.memoryGet(key);
      return raw == null ? undefined : (JSON.parse(raw) as T);
    } catch (error) {
      this.logger.warn(`cache get failed for ${key}: ${(error as Error).message}`);
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const raw = JSON.stringify(value);
    try {
      if (this.redis) await this.redis.set(this.prefix + key, raw, 'EX', ttlSeconds);
      else this.memorySet(key, raw, ttlSeconds);
    } catch (error) {
      this.logger.warn(`cache set failed for ${key}: ${(error as Error).message}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    try {
      if (this.redis) await this.redis.del(...keys.map((key) => this.prefix + key));
      else keys.forEach((key) => this.memory.delete(key));
    } catch (error) {
      this.logger.warn(`cache del failed: ${(error as Error).message}`);
    }
  }

  /** Read-through: return cached value or compute, store and return it. */
  async wrap<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await compute();
    if (value !== undefined) await this.set(key, value, ttlSeconds);
    return value;
  }

  /** Current version of a namespace; embed it in keys so a bump invalidates them all. */
  async version(namespace: string): Promise<number> {
    const key = `ns:${namespace}`;
    try {
      const raw = this.redis ? await this.redis.get(this.prefix + key) : this.memoryGet(key);
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  }

  async bump(...namespaces: string[]): Promise<void> {
    // Every authoritative change to public data passes here, so the website is told at the same moment.
    this.webSync.changed(...namespaces.map((namespace) => WEBSITE_AREAS[namespace]).filter((area): area is WebSyncArea => !!area));
    for (const namespace of namespaces) {
      const key = `ns:${namespace}`;
      try {
        if (this.redis) await this.redis.incr(this.prefix + key);
        else this.memorySet(key, String(Number(this.memoryGet(key) ?? 0) + 1), 86_400 * 365);
      } catch (error) {
        this.logger.warn(`cache bump failed for ${namespace}: ${(error as Error).message}`);
      }
    }
  }

  async versionedKey(namespace: string, key: string): Promise<string> {
    return `${namespace}:v${await this.version(namespace)}:${key}`;
  }

  private memoryGet(key: string): string | undefined {
    const entry = this.memory.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private memorySet(key: string, value: string, ttlSeconds: number): void {
    if (this.memory.size > 5000) this.memory.delete(this.memory.keys().next().value as string);
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

/** Cache namespaces bumped on authoritative writes. */
export const CacheNs = {
  vehicles: 'vehicles',
  catalogue: 'catalogue',
  content: 'content',
} as const;

/** Which website pages each cache namespace feeds. */
const WEBSITE_AREAS: Record<string, WebSyncArea | undefined> = { vehicles: 'cars', catalogue: 'cars', content: 'articles' };

@Global()
@Module({ providers: [CacheService], exports: [CacheService] })
export class CacheModule {}
