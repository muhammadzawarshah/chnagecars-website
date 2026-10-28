import { AuditService } from './audit.service';
import * as context from '../../common/context/request-context';

describe('audit attribution across apps', () => {
  afterEach(() => jest.restoreAllMocks());

  it('preserves existing human JWT attribution and audit payloads', async () => {
    jest.spyOn(context, 'requestContext').mockReturnValue({ user: { id: 'user-id', email: 'user@example.test', role: 'ADMIN', sessionId: 'session' }, requestId: 'request-id' });
    const db = { auditLog: { create: jest.fn() } };
    await new AuditService(db as any).record({ action: 'vehicle.update', entityType: 'vehicle', entityId: '100', after: { price: 90000 } });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: 'user-id', actorRole: 'ADMIN', requestId: 'request-id', after: { price: 90000 } }) });
  });

  it('attributes integration changes to the token without impersonating an administrator', async () => {
    jest.spyOn(context, 'requestContext').mockReturnValue({ dealerAppTokenId: 'token-id' });
    const db = { auditLog: { create: jest.fn() } };
    await new AuditService(db as any).record({ action: 'vehicle.create', entityType: 'vehicle', entityId: '100' });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: null, actorRole: 'DEALER_APP:token-id' }) });
  });

  it('retains explicit background/system actor overrides', async () => {
    jest.spyOn(context, 'requestContext').mockReturnValue({ dealerAppTokenId: 'token-id' });
    const db = { auditLog: { create: jest.fn() } };
    await new AuditService(db as any).record({ action: 'vehicle.update', entityType: 'vehicle', actorId: null, actorRole: 'SYSTEM' });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: null, actorRole: 'SYSTEM' }) });
  });
});
