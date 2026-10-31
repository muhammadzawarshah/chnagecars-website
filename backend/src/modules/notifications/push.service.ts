import { Injectable } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { parseServiceAccount } from '../../infrastructure/storage/storage.service';

@Injectable()
export class PushService {
  private auth?: GoogleAuth;
  constructor(private readonly config: AppConfig, private readonly db: PrismaService) {}

  get configured() { return !!this.config.get('FIREBASE_SERVICE_ACCOUNT'); }

  async send(userId: string, notification: { id: string; type: string; title: string; body: string }) {
    const devices = await this.db.pushDevice.findMany({ where: { userId, user: { status: 'ACTIVE', application: { enabled: true } } }, include: { user: { select: { appId: true } } } });
    if (!devices.length) return;
    const raw = this.config.get('FIREBASE_SERVICE_ACCOUNT');
    if (!raw) throw new Error('Firebase push credentials are not configured');
    const credentials = parseServiceAccount(raw);
    this.auth ??= new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/firebase.messaging'] });
    const client = await this.auth.getClient();
    for (const device of devices) {
      try {
        await client.request({ url: `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(credentials.project_id)}/messages:send`,
          method: 'POST', timeout: 10_000, data: { message: { token: device.token,
            notification: { title: notification.title, body: notification.body },
            data: { notificationId: notification.id, type: notification.type, appId: device.user?.appId ?? 'changecars' },
            android: { collapse_key: notification.id },
            apns: { headers: { 'apns-collapse-id': notification.id }, payload: { aps: { sound: 'default' } } },
          } } });
      } catch (error) {
        const response = (error as { response?: { data?: { error?: { details?: { errorCode?: string }[] } } } }).response;
        if (response?.data?.error?.details?.some(item => item.errorCode === 'UNREGISTERED')) {
          await this.db.pushDevice.deleteMany({ where: { id: device.id, token: device.token } });
        } else { throw new Error('FCM delivery failed; check Firebase configuration and worker logs'); }
      }
    }
  }
}
