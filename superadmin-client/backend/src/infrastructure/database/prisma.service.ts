import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';

/**
 * Primary PostgreSQL client (source of truth for all writes and consistent reads).
 * `replica` points at a read replica when DATABASE_READ_URL is configured and is only
 * meant for read-heavy, staleness-tolerant queries (public search and listings).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly replica: PrismaClient;

  constructor(config: AppConfig) {
    const max = config.get('DATABASE_POOL_MAX');
    // Prisma stores DateTime as UTC in timestamp columns; pin every session to UTC so raw SQL
    // using now() compares like with like regardless of the server's timezone setting.
    const options = '-c TimeZone=UTC';
    super({
      adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL'), max, options }),
      log: [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }],
    });
    const readUrl = config.get('DATABASE_READ_URL');
    this.replica = readUrl
      ? new PrismaClient({ adapter: new PrismaPg({ connectionString: readUrl, max, options }) })
      : this;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    if (this.replica !== this) await this.replica.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.replica !== this) await this.replica.$disconnect();
    await this.$disconnect();
  }
}
