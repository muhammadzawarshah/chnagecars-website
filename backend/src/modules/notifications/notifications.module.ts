import { Global, Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push.service';
import { AdminNotificationsController, NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsService, BroadcastService, NotificationsGateway, PushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
