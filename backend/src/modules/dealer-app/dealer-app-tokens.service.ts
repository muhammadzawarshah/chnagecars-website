import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { DealerStatus, Prisma } from '../../generated/prisma/client';
import { Errors } from '../../common/errors/app-error';
import { PaginationQueryDto, pageArgs, toPage } from '../../common/dto/pagination.dto';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateDealerAppTokenDto } from './dealer-app.dto';

// Explicit projection: raw credentials and hashes never appear in list/audit responses.
const TOKEN_METADATA = {
  id: true, dealerId: true, appName: true, tokenPrefix: true, scopes: true,
  createdById: true, expiresAt: true, revokedAt: true, createdAt: true,
} satisfies Prisma.DealerAppTokenSelect;

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class DealerAppTokensService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async issue(dealerId: string, dto: CreateDealerAppTokenDto, adminId: string) {
    await this.requireDealer(dealerId);
    const token = `ccd_app_${randomBytes(32).toString('base64url')}`;
    const metadata = await this.prisma.$transaction(async tx => {
      const created = await tx.dealerAppToken.create({
        data: {
          dealerId, appName: dto.appName, tokenHash: tokenHash(token), tokenPrefix: token.slice(0, 16),
          scopes: dto.scopes ?? ['dealer:read', 'vehicles:read'], createdById: adminId,
          expiresAt: new Date(Date.now() + (dto.expiresInDays ?? 90) * 86_400_000),
        },
        select: TOKEN_METADATA,
      });
      await this.audit.record({ action: 'dealer_app_token.create', entityType: 'dealer_app_token', entityId: created.id, after: created }, tx);
      return created;
    });
    return { ...metadata, token, tokenType: 'Bearer' as const };
  }

  async list(dealerId: string, query: PaginationQueryDto) {
    await this.requireDealer(dealerId);
    const { page, pageSize, skip, take } = pageArgs(query);
    const [data, total] = await Promise.all([
      this.prisma.dealerAppToken.findMany({ where: { dealerId }, select: TOKEN_METADATA, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take }),
      this.prisma.dealerAppToken.count({ where: { dealerId } }),
    ]);
    return toPage(data, total, page, pageSize);
  }

  async revoke(dealerId: string, id: string) {
    return this.prisma.$transaction(async tx => {
      const before = await tx.dealerAppToken.findFirst({ where: { id, dealerId }, select: TOKEN_METADATA });
      if (!before) throw Errors.notFound('Dealer app token');
      if (before.revokedAt) return before;
      const after = await tx.dealerAppToken.update({ where: { id }, data: { revokedAt: new Date() }, select: TOKEN_METADATA });
      await this.audit.record({ action: 'dealer_app_token.revoke', entityType: 'dealer_app_token', entityId: id, before, after }, tx);
      return after;
    });
  }

  async authenticate(token: string) {
    if (!/^ccd_app_[A-Za-z0-9_-]{43}$/.test(token)) throw Errors.unauthorized('INVALID_APP_TOKEN', 'Dealer app token is invalid or expired');
    const row = await this.prisma.dealerAppToken.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { dealer: { select: { id: true, status: true } } },
    });
    if (!row || row.revokedAt || row.expiresAt <= new Date()) {
      throw Errors.unauthorized('INVALID_APP_TOKEN', 'Dealer app token is invalid or expired');
    }
    if (row.dealer.status === DealerStatus.SUSPENDED || row.dealer.status === DealerStatus.REJECTED) {
      throw Errors.forbidden('DEALER_INACTIVE', 'This dealership is inactive');
    }
    return { tokenId: row.id, appName: row.appName, scopes: row.scopes, dealerId: row.dealer.id, dealerStatus: row.dealer.status };
  }

  private async requireDealer(dealerId: string) {
    if (!await this.prisma.dealer.findUnique({ where: { id: dealerId }, select: { id: true } })) throw Errors.notFound('Dealer');
  }
}
