import { Global, Inject, Injectable, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '../../config/app-config.service';

export const REDIS = Symbol('REDIS');
/** Shared Redis connection, or null when REDIS_URL is not configured. */
export type RedisClient = Redis | null;

@Injectable()
class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: RedisClient) {}
  async onApplicationShutdown(): Promise<void> {
    await this.redis?.quit().catch(() => undefined);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [AppConfig],
      useFactory: (config: AppConfig): RedisClient => {
        const url = config.get('REDIS_URL');
        const logger = new Logger('Redis');
        if (!url) {
          logger.warn('REDIS_URL not set: cache, rate limits and view counters use process memory (single instance only)');
          return null;
        }
        const client = new Redis(url, { maxRetriesPerRequest: 2, enableReadyCheck: true, lazyConnect: false });
        client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
        return client;
      },
    },
    RedisShutdown,
  ],
  exports: [REDIS],
})
export class RedisModule {}
