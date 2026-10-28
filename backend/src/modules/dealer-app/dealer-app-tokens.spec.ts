import { createHash } from 'node:crypto';
import { DealerAppTokensService } from './dealer-app-tokens.service';

const secret = `ccd_app_${'a'.repeat(43)}`;

function fixture() {
  const row = {
    id: 'token-1', dealerId: '3095', appName: 'Dealer app', tokenPrefix: secret.slice(0, 16),
    scopes: ['dealer:read', 'vehicles:read'], createdById: 'admin-id',
    expiresAt: new Date(Date.now() + 86_400_000), revokedAt: null, createdAt: new Date(),
    dealer: { id: '3095', status: 'APPROVED' },
  };
  const prisma = {
    dealer: { findUnique: jest.fn().mockResolvedValue({ id: '3095' }) },
    dealerAppToken: {
      create: jest.fn().mockImplementation(async ({ data, select }) => Object.fromEntries(Object.keys(select).map(key => [key, { ...row, ...data }[key as keyof typeof row]]))),
      findUnique: jest.fn().mockResolvedValue(row), findFirst: jest.fn().mockResolvedValue(row),
      findMany: jest.fn().mockResolvedValue([row]), count: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue({ ...row, revokedAt: new Date() }),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(fn => fn(prisma));
  const audit = { record: jest.fn() };
  return { service: new DealerAppTokensService(prisma as any, audit as any), prisma, audit, row };
}

describe('dealer app token lifecycle', () => {
  it('creates independent high-entropy tokens, persists only the hash and audits metadata', async () => {
    const { service, prisma, audit } = fixture();
    const first = await service.issue('3095', { appName: 'App A' }, 'admin-id');
    const second = await service.issue('3095', { appName: 'App B', scopes: ['vehicles:read', 'vehicles:write'] }, 'admin-id');
    expect(first.token).toMatch(/^ccd_app_[A-Za-z0-9_-]{43}$/);
    expect(second.token).not.toBe(first.token);
    const stored = prisma.dealerAppToken.create.mock.calls[0][0];
    expect(stored.data.tokenHash).toBe(createHash('sha256').update(first.token).digest('hex'));
    expect(stored.data.scopes).toEqual(['dealer:read', 'vehicles:read']);
    expect(stored.data.expiresAt.getTime() - Date.now()).toBeGreaterThan(89 * 86_400_000);
    expect(first).not.toHaveProperty('tokenHash');
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain(first.token);
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain(stored.data.tokenHash);
    expect(stored.select.tokenHash).toBeUndefined();
  });

  it('does not issue credentials for a nonexistent dealership', async () => {
    const { service, prisma } = fixture();
    prisma.dealer.findUnique.mockResolvedValue(null);
    await expect(service.issue('missing', { appName: 'App' }, 'admin')).rejects.toMatchObject({ code: 'DEALER_NOT_FOUND' });
    expect(prisma.dealerAppToken.create).not.toHaveBeenCalled();
  });

  it('lists metadata with pagination without selecting any credential hashes', async () => {
    const { service, prisma } = fixture();
    const result = await service.list('3095', { page: 2, pageSize: 10 });
    expect(result.meta).toEqual({ page: 2, pageSize: 10, total: 1, pageCount: 1 });
    expect(prisma.dealerAppToken.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { dealerId: '3095' }, skip: 10, take: 10 }));
    expect(prisma.dealerAppToken.findMany.mock.calls[0][0].select).not.toHaveProperty('tokenHash');
  });

  it('derives the dealer and scopes from the hashed credential', async () => {
    const { service, prisma } = fixture();
    expect(await service.authenticate(secret)).toEqual({ tokenId: 'token-1', dealerId: '3095', dealerStatus: 'APPROVED', appName: 'Dealer app', scopes: ['dealer:read', 'vehicles:read'] });
    expect(prisma.dealerAppToken.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { tokenHash: createHash('sha256').update(secret).digest('hex') } }));
  });

  it.each(['', 'user.jwt.token', `ccd_app_${'x'.repeat(42)}`])('rejects malformed tokens before querying storage: %s', async token => {
    const { service, prisma } = fixture();
    await expect(service.authenticate(token)).rejects.toMatchObject({ code: 'INVALID_APP_TOKEN' });
    expect(prisma.dealerAppToken.findUnique).not.toHaveBeenCalled();
  });

  it.each(['missing', 'expired', 'revoked'] as const)('rejects %s credentials', async state => {
    const { service, prisma, row } = fixture();
    prisma.dealerAppToken.findUnique.mockResolvedValue(state === 'missing' ? null : { ...row, ...(state === 'expired' ? { expiresAt: new Date(Date.now() - 1) } : { revokedAt: new Date() }) });
    await expect(service.authenticate(secret)).rejects.toMatchObject({ code: 'INVALID_APP_TOKEN' });
  });

  it.each(['SUSPENDED', 'REJECTED'])('blocks a %s dealer even with an unexpired token', async status => {
    const { service, prisma, row } = fixture();
    prisma.dealerAppToken.findUnique.mockResolvedValue({ ...row, dealer: { id: '3095', status } });
    await expect(service.authenticate(secret)).rejects.toMatchObject({ code: 'DEALER_INACTIVE' });
  });

  it('revokes immediately and checks storage on the next authentication', async () => {
    const { service, prisma, row } = fixture();
    await service.revoke('3095', row.id);
    prisma.dealerAppToken.findUnique.mockResolvedValue({ ...row, revokedAt: new Date() });
    await expect(service.authenticate(secret)).rejects.toMatchObject({ code: 'INVALID_APP_TOKEN' });
    expect(prisma.dealerAppToken.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: row.id, dealerId: '3095' } }));
  });

  it('cannot revoke a token belonging to another dealership', async () => {
    const { service, prisma } = fixture();
    prisma.dealerAppToken.findFirst.mockResolvedValue(null);
    await expect(service.revoke('other-dealer', 'token-1')).rejects.toMatchObject({ code: 'DEALER_APP_TOKEN_NOT_FOUND' });
    expect(prisma.dealerAppToken.update).not.toHaveBeenCalled();
  });

  it('repeated revocation does not overwrite the revocation time', async () => {
    const { service, prisma, row } = fixture();
    prisma.dealerAppToken.findFirst.mockResolvedValue({ ...row, revokedAt: new Date() });
    await service.revoke('3095', row.id);
    expect(prisma.dealerAppToken.update).not.toHaveBeenCalled();
  });
});
