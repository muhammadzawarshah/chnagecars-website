import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DealerPermission, VehicleStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { NotificationTypes } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import { PublicVehiclesService } from './public-vehicles.service';
import { VehicleImagesService } from './vehicle-images.service';
import { VehiclesService } from './vehicles.service';

const formatRand = (value: number) => `R${value.toLocaleString('en-ZA')}`;

/** FR-48 vehicle status notifications and FR-37/FR-39 favourite updates, delivered by the worker. */
@Injectable()
export class VehicleEventHandlers implements OnModuleInit {
  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly images: VehicleImagesService,
  ) {}

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.VehicleImageUploaded, 'vehicles.process-image', (event) => this.images.process(event.payload.imageId));

    this.outbox.on(OutboxEvents.VehicleStatusChanged, 'vehicles.status-notifications', async (event) => {
      const { vehicleId, dealerId, action, to, reason, actorType } = event.payload;
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true, title: true, slug: true, branchId: true, price: true } });
      if (!vehicle) return;
      const data = { vehicleId, slug: vehicle.slug, status: to, action };

      if (action === 'submit') {
        await this.notifications.notify({
          userIds: await this.notifications.adminRecipients(),
          type: NotificationTypes.VehicleReviewRequested,
          title: 'Listing awaiting review',
          body: `${vehicle.title} was submitted for review.`,
          data,
        });
      }

      const dealerFacing = ['approve', 'reject'].includes(action) || (actorType === 'admin' && ['suspend', 'archive', 'unsuspend'].includes(action)) || actorType === 'system';
      if (dealerFacing) {
        const messages: Record<string, string> = {
          approve: `${vehicle.title} was approved and can now be published.`,
          reject: `${vehicle.title} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
          suspend: `${vehicle.title} was suspended by an administrator.${reason ? ` Reason: ${reason}` : ''}`,
          archive: `${vehicle.title} was archived by an administrator.`,
          unsuspend: `${vehicle.title} is live again.`,
          release: `The reservation on ${vehicle.title} expired and it is available again.`,
        };
        await this.notifications.notify({
          userIds: await this.notifications.dealerRecipients(dealerId, DealerPermission.INVENTORY_MANAGE, vehicle.branchId),
          type: NotificationTypes.VehicleStatus,
          title: `Listing ${String(to).toLowerCase().replace('_', ' ')}`,
          body: messages[action] ?? `${vehicle.title} is now ${to}.`,
          data,
        });
      }

      if (to === VehicleStatus.RESERVED || to === VehicleStatus.SOLD) {
        const fans = await this.prisma.favourite.findMany({ where: { vehicleId }, select: { userId: true }, take: 5000 });
        await this.notifications.notify({
          userIds: fans.map((fan) => fan.userId),
          type: NotificationTypes.FavouriteStatus,
          title: to === VehicleStatus.SOLD ? 'A saved vehicle was sold' : 'A saved vehicle was reserved',
          body: `${vehicle.title} is now ${to === VehicleStatus.SOLD ? 'sold' : 'reserved'}.`,
          data,
        });
      }
    });

    this.outbox.on(OutboxEvents.VehiclePriceChanged, 'vehicles.favourite-price-drop', async (event) => {
      const { vehicleId, oldPrice, newPrice } = event.payload;
      if (newPrice >= oldPrice) return;
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { title: true, slug: true } });
      if (!vehicle) return;
      const fans = await this.prisma.favourite.findMany({ where: { vehicleId }, select: { userId: true }, take: 5000 });
      await this.notifications.notify({
        userIds: fans.map((fan) => fan.userId),
        type: NotificationTypes.FavouritePriceDrop,
        title: 'Price drop on a saved vehicle',
        body: `${vehicle.title} dropped from ${formatRand(oldPrice)} to ${formatRand(newPrice)}.`,
        data: { vehicleId, slug: vehicle.slug, oldPrice, newPrice },
      });
    });
  }
}

/** Scheduled vehicle jobs. Only active in the worker (ScheduleModule is loaded there). */
@Injectable()
export class VehicleJobs {
  private readonly logger = new Logger(VehicleJobs.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
    private readonly publicVehicles: PublicVehiclesService,
  ) {}

  /** Reservations are time-boxed: release holds that have run out (BR-05). */
  @Interval('vehicles-release-reservations', 60_000)
  async releaseExpiredReservations(): Promise<void> {
    const expired = await this.prisma.vehicle.findMany({
      where: { status: VehicleStatus.RESERVED, reservedUntil: { lt: new Date() } },
      select: { id: true },
      take: 200,
    });
    for (const vehicle of expired) {
      try {
        await this.vehicles.transition(vehicle.id, VehicleStatus.PUBLISHED, { type: 'system', userId: null }, { reason: 'Reservation expired', action: 'release' });
      } catch (error) {
        this.logger.warn(`Could not release reservation for ${vehicle.id}: ${(error as Error).message}`);
      }
    }
  }

  @Interval('vehicles-flush-views', 30_000)
  async flushViews(): Promise<void> {
    await this.publicVehicles.flushViews();
  }

  @Interval('vehicles-trim-recently-viewed', 3600_000)
  async trimRecentlyViewed(): Promise<void> {
    await this.publicVehicles.trimRecentlyViewed();
  }
}
