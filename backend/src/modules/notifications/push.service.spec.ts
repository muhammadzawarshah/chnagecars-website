import { PushService } from './push.service';
import { GoogleAuth } from 'google-auth-library';

jest.mock('google-auth-library', () => ({ GoogleAuth: jest.fn() }));

const credentials = JSON.stringify({ project_id: 'test-project', client_email: 'test@example.com', private_key: 'fake-key' });
const notification = { id: 'notification-a', title: 'Hello', body: 'A message', type: 'admin.announcement' };

function setup() {
  const request = jest.fn().mockResolvedValue({});
  (GoogleAuth as unknown as jest.Mock).mockImplementation(() => ({ getClient: async () => ({ request }) }));
  const db = { pushDevice: { findMany: jest.fn().mockResolvedValue([{ id: 'device', token: 'fcm-token' }]),
    deleteMany: jest.fn() } };
  const service = new PushService({ get: () => credentials } as any, db as any);
  return { request, db, service };
}

describe('mobile push delivery', () => {
  it('sends the same persisted notification ID for client deduplication', async () => {
    const { service, request, db } = setup();
    await service.send('user-a', notification);
    expect(db.pushDevice.findMany).toHaveBeenCalledWith({ where: { userId: 'user-a', user: { status: 'ACTIVE', application: { enabled: true } } }, include: { user: { select: { appId: true } } } });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://fcm.googleapis.com/v1/projects/test-project/messages:send',
      data: { message: expect.objectContaining({ token: 'fcm-token', data: { notificationId: 'notification-a', type: 'admin.announcement', appId: 'changecars' } }) },
    }));
  });

  it('removes only an explicitly unregistered device token', async () => {
    const { service, request, db } = setup();
    request.mockRejectedValue({ response: { data: { error: { details: [{ errorCode: 'UNREGISTERED' }] } } } });
    await service.send('user-a', notification);
    expect(db.pushDevice.deleteMany).toHaveBeenCalledWith({ where: { id: 'device', token: 'fcm-token' } });
  });

  it('retains tokens and surfaces transient failures for outbox retry', async () => {
    const { service, request, db } = setup();
    request.mockRejectedValue(new Error('Unavailable'));
    await expect(service.send('user-a', notification)).rejects.toThrow('FCM delivery failed');
    expect(db.pushDevice.deleteMany).not.toHaveBeenCalled();
  });
});
