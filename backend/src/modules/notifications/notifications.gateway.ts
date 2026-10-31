import { GROUP1_APP_ID } from '../customer-apps/group1';
import { MAIN_APP } from '../customer-apps/app-context';
import { Inject, Logger, OnApplicationShutdown } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AppConfig } from '../../config/app-config.service';
import type { AccessTokenPayload } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { REDIS, RedisClient } from '../../infrastructure/redis/redis.module';

const CHANNEL = 'cc:notifications:live';

@WebSocketGateway({ namespace: '/notifications', transports: ['websocket'] })
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnApplicationShutdown {
  @WebSocketServer() server: Server;
  private subscriber: RedisClient = null;
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwt: JwtService, private readonly db: PrismaService,
    private readonly config: AppConfig, @Inject(REDIS) private readonly redis: RedisClient) {}

  async afterInit() {
    if (!this.redis) return;
    this.subscriber = this.redis.duplicate();
    this.subscriber.on('error', () => this.logger.warn('Notification subscription unavailable'));
    this.subscriber.on('message', (_channel, raw) => {
      try { const event = JSON.parse(raw); this.server.to(`user:${event.userId}`).emit('notification', event.notification); }
      catch { this.logger.warn('Invalid notification event'); }
    });
    await this.subscriber.subscribe(CHANNEL);
  }

  async handleConnection(client: Socket) {
    try {
      const origin = client.handshake.headers.origin;
      if (origin && !this.config.get('CORS_ORIGINS').includes(origin)) throw new Error('Origin');
      const token = client.handshake.auth?.token;
      if (typeof token !== 'string' || token.length > 8192) throw new Error('Token');
      const valid = async () => {
        const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
        if (!payload.sub || !payload.sid) throw new Error('Token');
        const appId = payload.appId ?? MAIN_APP;
        if (![MAIN_APP, GROUP1_APP_ID].includes(appId)) throw new Error('App unavailable');
        if (appId !== (client.handshake.auth?.appId ?? MAIN_APP)) throw new Error('App mismatch');
        const session = await this.db.session.findFirst({ where: { id: payload.sid, userId: payload.sub,
          revokedAt: null, expiresAt: { gt: new Date() }, user: { status: 'ACTIVE', appId, application: { enabled: true } } }, select: { id: true } });
        if (!session) throw new Error('Session');
        return payload;
      };
      const payload = await valid();
      if (!client.connected) return;
      await client.join(`user:${payload.sub}`);
      this.timers.set(client.id, setInterval(() => { void valid().catch(() => client.disconnect(true)); }, 15_000));
      client.emit('ready', { userId: payload.sub });
    } catch { client.disconnect(true); }
  }

  handleDisconnect(client: Socket) {
    clearInterval(this.timers.get(client.id));
    this.timers.delete(client.id);
  }

  async publish(userId: string, notification: unknown) {
    if (this.redis) await this.redis.publish(CHANNEL, JSON.stringify({ userId, notification }));
    else this.server?.to(`user:${userId}`).emit('notification', notification);
  }

  async onApplicationShutdown() {
    for (const timer of this.timers.values()) clearInterval(timer);
    this.timers.clear();
    await this.subscriber?.quit().catch(() => undefined);
  }
}
