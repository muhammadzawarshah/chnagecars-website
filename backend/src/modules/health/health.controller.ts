import { Controller, Get, HttpStatus, Inject, Module, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/decorators/auth.decorators';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { REDIS, RedisClient } from '../../infrastructure/redis/redis.module';

/** Load-balancer probes (brief section 4 and 14). */
@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: RedisClient,
  ) {}

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness: the process is up' })
  live() {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness: dependencies reachable (returns 503 otherwise)' })
  async ready(@Res() res: Response) {
    const checks: Record<string, 'up' | 'down' | 'disabled'> = {};
    const timeout = <T>(promise: Promise<T>) =>
      Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))]);

    try {
      await timeout(this.prisma.$queryRaw`SELECT 1`);
      checks.database = 'up';
    } catch {
      checks.database = 'down';
    }
    if (!this.redis) checks.redis = 'disabled';
    else {
      try {
        await timeout(this.redis.ping());
        checks.redis = 'up';
      } catch {
        checks.redis = 'down';
      }
    }
    const healthy = !Object.values(checks).includes('down');
    res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({ status: healthy ? 'ok' : 'degraded', checks });
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
