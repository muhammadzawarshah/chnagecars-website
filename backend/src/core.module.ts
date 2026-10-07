import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage } from 'node:http';
import { AppConfig, AppConfigModule } from './config/app-config.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { WebAwareThrottlerGuard } from './common/guards/web-throttler.guard';
import { CacheHeadersInterceptor } from './common/interceptors/cache-headers.interceptor';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AuditModule } from './infrastructure/audit/audit.service';
import { CacheModule } from './infrastructure/cache/cache.service';
import { WebSyncModule } from './infrastructure/web-sync/web-sync.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { MessagingModule } from './infrastructure/messaging/messaging.module';
import { OutboxModule } from './infrastructure/outbox/outbox.service';
import { REDIS, RedisClient, RedisModule } from './infrastructure/redis/redis.module';
import { StorageModule } from './infrastructure/storage/storage.service';
import { DealerAccessModule } from './modules/dealers/dealer-access';

/** Infrastructure shared by the API process and the worker process. */
export const INFRASTRUCTURE_MODULES = [
  AppConfigModule,
  LoggerModule.forRootAsync({
    inject: [AppConfig],
    useFactory: (config: AppConfig) => ({
      pinoHttp: {
        level: config.get('LOG_LEVEL'),
        genReqId: (req: IncomingMessage & { id?: string }) => req.id ?? '',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.refreshToken',
            'req.body.token',
          ],
          remove: true,
        },
        autoLogging: { ignore: (req: IncomingMessage) => (req.url ?? '').includes('/health/') },
        transport: config.isProduction ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
  }),
  ClsModule.forRoot({
    global: true,
    middleware: {
      mount: true,
      generateId: true,
      idGenerator: (req: IncomingMessage & { id?: string }) => req.id ?? '',
      setup: (cls, req) => {
        cls.set('ip', req.ip);
        cls.set('userAgent', req.headers['user-agent']);
      },
    },
  }),
  DatabaseModule,
  RedisModule,
  WebSyncModule,
  CacheModule,
  StorageModule,
  MessagingModule,
  OutboxModule,
  AuditModule,
  DealerAccessModule,
];

/** HTTP-only cross-cutting concerns: rate limiting, auth, RBAC, dealer isolation, error shape, idempotency. */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [AppConfig, REDIS],
      useFactory: (config: AppConfig, redis: RedisClient) => ({
        throttlers: [{ name: 'default', ttl: config.get('RATE_LIMIT_TTL_SECONDS') * 1000, limit: config.get('RATE_LIMIT_MAX') }],
        storage: redis ? new ThrottlerStorageRedisService(redis) : undefined,
      }),
    }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: WebAwareThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: CacheHeadersInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class HttpCoreModule {}
