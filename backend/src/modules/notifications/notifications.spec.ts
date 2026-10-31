import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminNotificationsController } from './notifications.controller';
import { BroadcastService } from './broadcast.service';
import { NotificationsGateway } from './notifications.gateway';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BroadcastNotificationDto } from './dto/notification.dto';

describe('notification access and delivery', () => {
  it('restricts broadcasts to SUPER_ADMIN', () => {
    const guard = new RolesGuard(new Reflector());
    const context = (role: string) => ({ getClass: () => AdminNotificationsController,
      getHandler: () => AdminNotificationsController.prototype.broadcast,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    }) as unknown as ExecutionContext;
    expect(guard.canActivate(context('SUPER_ADMIN'))).toBe(true);
    for (const role of ['ADMIN', 'DEALER', 'CUSTOMER']) expect(() => guard.canActivate(context(role))).toThrow();
  });

  it('rejects whitespace messages and overlong push content', async () => {
    for (const title of ['   ', 'a'.repeat(121)]) {
      const dto = plainToInstance(BroadcastNotificationDto, { title, body: 'Message', audience: 'all' });
      expect((await validate(dto)).length).toBeGreaterThan(0);
    }
  });

  it('never turns an empty selected audience into a broadcast', async () => {
    const db = { user: { count: jest.fn() } };
    const service = new BroadcastService(db as any, {} as any, {} as any, {} as any, {} as any);
    await expect(service.queue({ id: 'actor' } as any, { title: 'Hi', body: 'Hello', audience: 'selected' })).rejects.toThrow();
    expect(db.user.count).not.toHaveBeenCalled();
  });

  it('retries a campaign with stable notification and delivery IDs and respects opt-outs', async () => {
    const handlers = new Map<string, (event: any) => Promise<void>>();
    const outbox = { on: (type: string, _name: string, fn: (event: any) => Promise<void>) => handlers.set(type, fn) };
    const tx = { notification: { createMany: jest.fn() }, outboxEvent: { createMany: jest.fn() } };
    const db = { user: { findMany: jest.fn() }, notificationPreference: { findMany: jest.fn().mockResolvedValue([{ userId: 'opted-out' }]) },
      $transaction: (fn: any) => fn(tx) };
    const service = new BroadcastService(db as any, outbox as any, {} as any, {} as any, {} as any);
    service.onModuleInit();
    const event = { payload: { campaignId: 'campaign', title: 'Hi', body: 'Hello', audience: 'customers', queuedAt: new Date().toISOString() } };
    for (let i = 0; i < 2; i++) {
      db.user.findMany.mockResolvedValueOnce([{ id: 'allowed' }, { id: 'opted-out' }]).mockResolvedValueOnce([]);
      await handlers.get(OutboxEvents.NotificationBroadcast)!(event);
    }
    const first = tx.notification.createMany.mock.calls[0][0];
    expect(first.data).toHaveLength(1);
    expect(first.data[0].userId).toBe('allowed');
    expect(first.skipDuplicates).toBe(true);
    expect(tx.notification.createMany.mock.calls[1][0]).toEqual(first);
    expect(tx.outboxEvent.createMany.mock.calls[1][0]).toEqual(tx.outboxEvent.createMany.mock.calls[0][0]);
  });

  it('authenticates sockets and derives the private room from the token', async () => {
    jest.useFakeTimers();
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-a', sid: 'session-a' }) };
    const db = { session: { findFirst: jest.fn().mockResolvedValue({ id: 'session-a' }) } };
    const gateway = new NotificationsGateway(jwt as any, db as any, { get: () => ['https://app.example'] } as any, null);
    const socket = { id: 'socket', connected: true, handshake: { auth: { token: 'valid', userId: 'user-b' }, headers: {} },
      join: jest.fn(), emit: jest.fn(), disconnect: jest.fn() };
    await gateway.handleConnection(socket as any);
    expect(socket.join).toHaveBeenCalledWith('user:user-a');
    expect(socket.join).not.toHaveBeenCalledWith('user:user-b');
    jwt.verifyAsync.mockRejectedValue(new Error('Expired'));
    await jest.advanceTimersByTimeAsync(15_000);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
    gateway.handleDisconnect(socket as any);
    jest.useRealTimers();
  });

  it('rejects sockets from suspended or revoked sessions', async () => {
    const gateway = new NotificationsGateway({ verifyAsync: async () => ({ sub: 'u', sid: 's' }) } as any,
      { session: { findFirst: async () => null } } as any, { get: () => [] } as any, null);
    const socket = { handshake: { auth: { token: 'valid' }, headers: {} }, join: jest.fn(), disconnect: jest.fn() };
    await gateway.handleConnection(socket as any);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('does not deliver to a user who opted out after queuing', async () => {
    const handlers = new Map<string, (event: any) => Promise<void>>();
    const db = { notification: { findUnique: async () => ({ id: 'n', userId: 'u', type: 'admin.announcement' }) },
      user: { findFirst: async () => ({ id: 'u' }) }, notificationPreference: { findUnique: async () => ({ enabled: false }) } };
    const live = { publish: jest.fn() }, push = { send: jest.fn() };
    new BroadcastService(db as any, { on: (type: string, _name: string, fn: any) => handlers.set(type, fn) } as any,
      {} as any, live as any, push as any).onModuleInit();
    await handlers.get(OutboxEvents.NotificationDeliver)!({ payload: { notificationId: 'n' } });
    expect(live.publish).not.toHaveBeenCalled(); expect(push.send).not.toHaveBeenCalled();
  });
  it('relays worker events through Redis into only the recipient room', async () => {
    const listeners = new Map<string, (...args: any[]) => void>();
    const subscriber = { on: (event: string, fn: (...args: any[]) => void) => listeners.set(event, fn),
      subscribe: jest.fn(), quit: jest.fn().mockResolvedValue(undefined) };
    const redis = { duplicate: () => subscriber, publish: jest.fn() };
    const emit = jest.fn(), to = jest.fn().mockReturnValue({ emit });
    const gateway = new NotificationsGateway({} as any, {} as any, {} as any, redis as any);
    gateway.server = { to } as any;
    await gateway.afterInit();
    await gateway.publish('user-a', { id: 'notification-a' });
    const [channel, payload] = redis.publish.mock.calls[0];
    listeners.get('message')!(channel, payload);
    expect(to).toHaveBeenCalledWith('user:user-a');
    expect(emit).toHaveBeenCalledWith('notification', { id: 'notification-a' });
    expect(to).toHaveBeenCalledTimes(1);
    await gateway.onApplicationShutdown();
    expect(subscriber.quit).toHaveBeenCalled();
  });

  it('rejects a branded socket token when the app handshake names another app', async () => {
    const db = { session: { findFirst: jest.fn() } };
    const gateway = new NotificationsGateway({ verifyAsync: async () => ({ sub: 'u', sid: 's', appId: 'dealer-a' }) } as any,
      db as any, { get: () => [] } as any, null);
    const socket = { handshake: { auth: { token: 'valid', appId: 'dealer-b' }, headers: {} }, join: jest.fn(), disconnect: jest.fn() };
    await gateway.handleConnection(socket as any);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(db.session.findFirst).not.toHaveBeenCalled();
    expect(socket.join).not.toHaveBeenCalled();
  });

});
