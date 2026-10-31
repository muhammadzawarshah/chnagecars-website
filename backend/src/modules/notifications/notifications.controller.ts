import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../common/decorators/auth.decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { BroadcastNotificationDto, PushDeviceDto, RemovePushDeviceDto, NotificationListQueryDto, UpdateNotificationPreferencesDto } from './dto/notification.dto';
import { UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BroadcastService } from './broadcast.service';
import { PushService } from './push.service';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('me/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService, private readonly db: PrismaService) {}

  @Post('devices')
  registerDevice(@CurrentUser() user: AuthUser, @Body() dto: PushDeviceDto) {
    return this.db.pushDevice.upsert({ where: { token: dto.token },
      create: { ...dto, userId: user.id }, update: { userId: user.id, platform: dto.platform },
      select: { id: true, platform: true, updatedAt: true } });
  }

  @Delete('devices')
  async removeDevice(@CurrentUser() user: AuthUser, @Body() dto: RemovePushDeviceDto) {
    const result = await this.db.pushDevice.deleteMany({ where: { userId: user.id, token: dto.token } });
    return { removed: result.count };
  }

  @Get()
  @ApiOperation({ summary: 'My in-app notifications' })
  list(@CurrentUser() user: AuthUser, @Query() query: NotificationListQueryDto) {
    return this.notifications.list(user.id, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.notifications.markRead(user.id, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Notification preferences per type and channel (FR-39, FR-57)' })
  preferences(@CurrentUser() user: AuthUser) {
    return this.notifications.preferences(user.id);
  }

  @Put('preferences')
  updatePreferences(@CurrentUser() user: AuthUser, @Body() dto: UpdateNotificationPreferencesDto) {
    return this.notifications.updatePreferences(user.id, dto.items);
  }
}

@ApiTags('Admin notifications')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly broadcasts: BroadcastService, private readonly push: PushService) {}

  @Get('status')
  status() { return { pushConfigured: this.push.configured }; }

  @Post('broadcast')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue an in-app, real-time and mobile push announcement' })
  broadcast(@CurrentUser() user: AuthUser, @Body() dto: BroadcastNotificationDto) {
    return this.broadcasts.queue(user, dto);
  }
}
