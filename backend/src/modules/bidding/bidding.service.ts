import { Injectable, Logger } from '@nestjs/common';
import {
  BiddingStatus,
  CounterOfferStatus,
  DealerPermission,
  LeadSource,
  LeadStage,
  Offer,
  OfferStatus,
  Prisma,
  SellRequestStatus,
} from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import { AuditService } from '../../infrastructure/audit/audit.service';
import type { Db } from '../../infrastructure/database';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { LeadsService } from '../crm/leads.service';
import { DealerContext } from '../dealers/dealer-access';
import { ACTIVE_OFFER_STATUSES, canAcceptBids, checkAcceptable, isDealerEligible } from './bidding.rules';
import {
  CounterOfferDto,
  CounterResponseDto,
  DealerOfferQueryDto,
  DealerSessionQueryDto,
  OpenBiddingDto,
  ReopenBiddingDto,
  SubmitOfferDto,
  UpdateOfferDto,
} from './dto/bidding.dto';

/** Vehicle details dealers may see before acceptance: no customer identity, registration or VIN. */
const dealerVisibleSellRequest = {
  id: true,
  reference: true,
  province: true,
  city: true,
  makeName: true,
  modelName: true,
  variantName: true,
  year: true,
  mileage: true,
  condition: true,
  colour: true,
  transmission: true,
  fuelType: true,
  hasServiceHistory: true,
  hasAccidentHistory: true,
  hasOutstandingFinance: true,
  notes: true,
  images: { orderBy: { position: 'asc' as const }, select: { id: true, storageKey: true } },
} satisfies Prisma.SellRequestSelect;

/**
 * Dealer bidding and offers (FR-10, FR-52..FR-56, BR-06..BR-12).
 * Every mutation that can conflict locks the session row (SELECT ... FOR UPDATE) so bids,
 * withdrawals, counters and acceptance are serialised per vehicle. Acceptance follows the
 * brief's critical transaction (section 5.2) and fails rather than risk a duplicate deal.
 */
@Injectable()
export class BiddingService {
  private readonly logger = new Logger(BiddingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly leads: LeadsService,
    private readonly config: AppConfig,
    private readonly storage: StorageService,
  ) {}

  private async lockSession(db: Db, sessionId: string) {
    await db.$queryRaw(Prisma.sql`SELECT id FROM bidding_sessions WHERE id = ${sessionId}::uuid FOR UPDATE`);
    const session = await db.biddingSession.findUnique({ where: { id: sessionId }, include: { invites: { select: { dealerId: true } }, sellRequest: true } });
    if (!session) throw Errors.notFound('Bidding session');
    return { ...session, inviteDealerIds: session.invites.map((invite) => invite.dealerId) };
  }

  private async revision(db: Db, offer: Pick<Offer, 'id' | 'amount' | 'terms'>, status: OfferStatus, changedById: string | null, reason?: string) {
    await db.offerRevision.create({ data: { offerId: offer.id, amount: offer.amount, terms: offer.terms, status, changedById, reason } });
  }

  // ───────────── admin: open / reopen / cancel (FR-10, FR-52) ─────────────

  async openSession(sellRequestId: string, dto: OpenBiddingDto, adminId: string) {
    const now = new Date();
    const opensAt = dto.opensAt ? new Date(dto.opensAt) : now;
    const closesAt = new Date(dto.closesAt);
    const maxHours = this.config.get('BIDDING_MAX_DURATION_HOURS');
    if (closesAt <= opensAt || closesAt <= now) throw Errors.badRequest('INVALID_WINDOW', 'closesAt must be after opensAt and in the future');
    if (closesAt.getTime() - opensAt.getTime() > maxHours * 3600_000) {
      throw Errors.badRequest('WINDOW_TOO_LONG', `Bidding may run at most ${maxHours} hours`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM sell_requests WHERE id = ${sellRequestId}::uuid FOR UPDATE`);
      const request = await tx.sellRequest.findUnique({ where: { id: sellRequestId } });
      if (!request) throw Errors.notFound('Sell request');
      const allowed: SellRequestStatus[] = [SellRequestStatus.SUBMITTED, SellRequestStatus.UNDER_REVIEW, SellRequestStatus.VALUED, SellRequestStatus.BIDDING];
      if (!allowed.includes(request.status)) throw Errors.conflict('NOT_ELIGIBLE', `A request that is ${request.status} cannot go to bidding`);
      const live = await tx.biddingSession.count({ where: { sellRequestId, status: { in: [BiddingStatus.SCHEDULED, BiddingStatus.OPEN] } } });
      if (live) throw Errors.conflict('BIDDING_IN_PROGRESS', 'This vehicle already has an active bidding process');

      const status = opensAt <= now ? BiddingStatus.OPEN : BiddingStatus.SCHEDULED;
      const session = await tx.biddingSession.create({
        data: {
          sellRequestId,
          status,
          opensAt,
          closesAt,
          allowBidModification: dto.allowBidModification ?? true,
          allowBidWithdrawal: dto.allowBidWithdrawal ?? true,
          allowCounterOffers: dto.allowCounterOffers ?? true,
          offerValidityHours: dto.offerValidityHours ?? 48,
          reservePrice: dto.reservePrice,
          eligibleProvinces: dto.eligibleProvinces ?? [],
          createdById: adminId,
          invites: dto.inviteDealerIds?.length ? { create: [...new Set(dto.inviteDealerIds)].map((dealerId) => ({ dealerId })) } : undefined,
        },
      });
      await tx.sellRequest.update({ where: { id: sellRequestId }, data: { status: SellRequestStatus.BIDDING, type: 'SELL' } });
      if (status === BiddingStatus.OPEN) {
        await this.outbox.enqueue(tx, { type: OutboxEvents.BiddingOpened, aggregateType: 'bidding_session', aggregateId: session.id, payload: { sessionId: session.id } });
      }
      await this.audit.record({ action: 'bidding.open', entityType: 'bidding_session', entityId: session.id, after: session }, tx);
      return session;
    });
  }

  /** BR-07: a closed process accepts no bids unless explicitly reopened. */
  async reopen(sessionId: string, dto: ReopenBiddingDto) {
    const closesAt = new Date(dto.closesAt);
    if (closesAt <= new Date()) throw Errors.badRequest('INVALID_WINDOW', 'closesAt must be in the future');
    return this.prisma.$transaction(async (tx) => {
      const session = await this.lockSession(tx, sessionId);
      if (session.status !== BiddingStatus.CLOSED || session.acceptedOfferId) {
        throw Errors.conflict('CANNOT_REOPEN', `Only closed, un-awarded sessions can be reopened (status ${session.status})`);
      }
      const after = await tx.biddingSession.update({ where: { id: sessionId }, data: { status: BiddingStatus.OPEN, closesAt, closedAt: null } });
      await this.outbox.enqueue(tx, { type: OutboxEvents.BiddingOpened, aggregateType: 'bidding_session', aggregateId: sessionId, payload: { sessionId, reopened: true } });
      await this.audit.record({ action: 'bidding.reopen', entityType: 'bidding_session', entityId: sessionId, before: { status: session.status, closesAt: session.closesAt }, after: { status: after.status, closesAt, reason: dto.reason } }, tx);
      return after;
    });
  }

  async cancelSession(sessionId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.lockSession(tx, sessionId);
      if (session.status === BiddingStatus.AWARDED || session.status === BiddingStatus.CANCELLED) {
        throw Errors.conflict('CANNOT_CANCEL', `Session is already ${session.status}`);
      }
      const active = await tx.offer.findMany({ where: { sessionId, status: { in: ACTIVE_OFFER_STATUSES } } });
      for (const offer of active) {
        await tx.offer.update({ where: { id: offer.id }, data: { status: OfferStatus.REJECTED, respondedAt: new Date() } });
        await this.revision(tx, offer, OfferStatus.REJECTED, null, 'Bidding cancelled');
      }
      await tx.counterOffer.updateMany({ where: { offer: { sessionId }, status: CounterOfferStatus.OPEN }, data: { status: CounterOfferStatus.CANCELLED } });
      const after = await tx.biddingSession.update({ where: { id: sessionId }, data: { status: BiddingStatus.CANCELLED, closedAt: new Date() } });
      await tx.sellRequest.updateMany({ where: { id: session.sellRequestId, status: SellRequestStatus.BIDDING }, data: { status: SellRequestStatus.VALUED } });
      await this.audit.record({ action: 'bidding.cancel', entityType: 'bidding_session', entityId: sessionId, before: { status: session.status }, after: { status: after.status, reason } }, tx);
      return after;
    });
  }

  async adminListSessions(query: DealerSessionQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.BiddingSessionWhereInput = query.status ? { status: query.status } : {};
    const [rows, total] = await Promise.all([
      this.prisma.biddingSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { sellRequest: { select: { reference: true, makeName: true, modelName: true, year: true } }, _count: { select: { offers: true, invites: true } } },
      }),
      this.prisma.biddingSession.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  // ───────────── dealer side ─────────────

  private async dealerProfile(ctx: DealerContext) {
    return this.prisma.dealer.findUniqueOrThrow({ where: { id: ctx.dealerId }, select: { id: true, status: true, biddingEnabled: true, province: true } });
  }

  async listSessionsForDealer(ctx: DealerContext, query: DealerSessionQueryDto) {
    const dealer = await this.dealerProfile(ctx);
    if (!dealer.biddingEnabled) return toPage([], 0, 1, query.pageSize ?? 20);
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.BiddingSessionWhereInput = {
      status: query.status ?? BiddingStatus.OPEN,
      AND: [
        { OR: [{ invites: { none: {} } }, { invites: { some: { dealerId: ctx.dealerId } } }] },
        { OR: [{ eligibleProvinces: { isEmpty: true } }, { eligibleProvinces: { has: dealer.province } }] },
      ],
    };
    const [rows, total] = await Promise.all([
      this.prisma.biddingSession.findMany({
        where,
        orderBy: { closesAt: 'asc' },
        skip,
        take,
        include: {
          sellRequest: { select: dealerVisibleSellRequest },
          offers: { where: { dealerId: ctx.dealerId }, select: { id: true, amount: true, status: true, expiresAt: true, version: true } },
          _count: { select: { offers: { where: { status: { in: ACTIVE_OFFER_STATUSES } } } } },
        },
      }),
      this.prisma.biddingSession.count({ where }),
    ]);
    return toPage(
      rows.map(({ offers, _count, ...session }) => ({ ...session, myOffer: offers[0] ?? null, competingOffers: _count.offers, sellRequest: this.withImageUrls(session.sellRequest) })),
      total,
      page,
      pageSize,
    );
  }

  async getSessionForDealer(ctx: DealerContext, sessionId: string) {
    const [dealer, session] = await Promise.all([
      this.dealerProfile(ctx),
      this.prisma.biddingSession.findUnique({
        where: { id: sessionId },
        include: {
          invites: { select: { dealerId: true } },
          sellRequest: { select: dealerVisibleSellRequest },
          offers: { where: { dealerId: ctx.dealerId }, include: { revisions: { orderBy: { createdAt: 'desc' } }, counterOffers: { orderBy: { createdAt: 'desc' } } } },
        },
      }),
    ]);
    if (!session || !isDealerEligible({ ...session, inviteDealerIds: session.invites.map((invite) => invite.dealerId) }, dealer)) {
      throw Errors.notFound('Bidding session');
    }
    const { invites, offers, ...rest } = session;
    return { ...rest, sellRequest: this.withImageUrls(rest.sellRequest), myOffer: offers[0] ?? null, acceptingBids: canAcceptBids(session) };
  }

  private withImageUrls<T extends { images: { id: string; storageKey: string }[] }>(request: T) {
    return { ...request, images: request.images.map((image) => ({ id: image.id, url: this.storage.publicUrl(image.storageKey) })) };
  }

  /** Submit a bid, or revise/renew this dealer's existing bid on the session (one offer per dealer, BR-09). */
  async submitOffer(ctx: DealerContext, sessionId: string, dto: SubmitOfferDto | UpdateOfferDto) {
    const dealer = await this.dealerProfile(ctx);
    const result = await this.prisma.$transaction(async (tx) => {
      const session = await this.lockSession(tx, sessionId);
      if (!isDealerEligible(session, dealer)) throw Errors.forbidden('NOT_ELIGIBLE', 'Your dealership is not eligible for this bidding process');
      if (!canAcceptBids(session)) throw Errors.conflict('BIDDING_CLOSED', 'Bidding is not open for this vehicle');
      if (session.reservePrice && dto.amount < session.reservePrice) {
        throw Errors.badRequest('BELOW_RESERVE', `Offers must be at least R${session.reservePrice.toLocaleString('en-ZA')}`);
      }
      const expiresAt = new Date(Date.now() + session.offerValidityHours * 3600_000);
      const existing = await tx.offer.findUnique({ where: { sessionId_dealerId: { sessionId, dealerId: ctx.dealerId } } });

      if (!existing) {
        const offer = await tx.offer.create({
          data: { sessionId, dealerId: ctx.dealerId, submittedById: ctx.userId, amount: dto.amount, terms: dto.terms, dealerNotes: dto.dealerNotes, expiresAt },
        });
        await this.revision(tx, offer, OfferStatus.SUBMITTED, ctx.userId);
        await this.outbox.enqueue(tx, { type: OutboxEvents.OfferSubmitted, aggregateType: 'offer', aggregateId: offer.id, payload: { offerId: offer.id } });
        await this.audit.record({ action: 'offer.submit', entityType: 'offer', entityId: offer.id, after: { amount: offer.amount, sessionId } }, tx);
        return offer;
      }

      if (existing.status === OfferStatus.ACCEPTED || existing.status === OfferStatus.SUPERSEDED) {
        throw Errors.conflict('OFFER_FINAL', `Your offer is already ${existing.status}`);
      }
      const isActive = ACTIVE_OFFER_STATUSES.includes(existing.status);
      if (isActive && !session.allowBidModification) throw Errors.conflict('MODIFICATION_NOT_ALLOWED', 'Bids cannot be modified in this bidding process (BR-08)');
      if ('expectedVersion' in dto && dto.expectedVersion !== undefined && dto.expectedVersion !== existing.version) {
        throw Errors.conflict('STALE_VERSION', 'Your offer changed meanwhile; reload and retry', { currentVersion: existing.version });
      }
      // A customer counter is superseded by the dealer's revised offer.
      await tx.counterOffer.updateMany({ where: { offerId: existing.id, status: CounterOfferStatus.OPEN }, data: { status: CounterOfferStatus.DECLINED, respondedById: ctx.userId, respondedAt: new Date() } });
      const status = isActive ? OfferStatus.UPDATED : OfferStatus.SUBMITTED;
      const offer = await tx.offer.update({
        where: { id: existing.id },
        data: { amount: dto.amount, terms: dto.terms, dealerNotes: dto.dealerNotes, status, expiresAt, submittedById: ctx.userId, respondedAt: null, version: { increment: 1 } },
      });
      await this.revision(tx, offer, status, ctx.userId, isActive ? 'Bid revised' : `Bid renewed after ${existing.status.toLowerCase()}`);
      await this.outbox.enqueue(tx, { type: OutboxEvents.OfferUpdated, aggregateType: 'offer', aggregateId: offer.id, payload: { offerId: offer.id, previousAmount: existing.amount } });
      await this.audit.record({ action: 'offer.update', entityType: 'offer', entityId: offer.id, before: { amount: existing.amount, status: existing.status }, after: { amount: offer.amount, status } }, tx);
      return offer;
    });
    return result;
  }

  async updateOffer(ctx: DealerContext, offerId: string, dto: UpdateOfferDto) {
    const offer = await this.prisma.offer.findFirst({ where: { id: offerId, dealerId: ctx.dealerId } });
    if (!offer) throw Errors.notFound('Offer');
    return this.submitOffer(ctx, offer.sessionId, dto);
  }

  async withdraw(ctx: DealerContext, offerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.offer.findFirst({ where: { id: offerId, dealerId: ctx.dealerId } });
      if (!existing) throw Errors.notFound('Offer');
      const session = await this.lockSession(tx, existing.sessionId);
      const offer = await tx.offer.findUniqueOrThrow({ where: { id: offerId } });
      if (!session.allowBidWithdrawal) throw Errors.conflict('WITHDRAWAL_NOT_ALLOWED', 'Bids cannot be withdrawn in this bidding process');
      if (!ACTIVE_OFFER_STATUSES.includes(offer.status)) throw Errors.conflict('OFFER_NOT_ACTIVE', `Offer is ${offer.status}`);
      const after = await tx.offer.update({ where: { id: offerId }, data: { status: OfferStatus.WITHDRAWN, respondedAt: new Date(), version: { increment: 1 } } });
      await tx.counterOffer.updateMany({ where: { offerId, status: CounterOfferStatus.OPEN }, data: { status: CounterOfferStatus.CANCELLED } });
      await this.revision(tx, after, OfferStatus.WITHDRAWN, ctx.userId);
      await this.outbox.enqueue(tx, { type: OutboxEvents.OfferWithdrawn, aggregateType: 'offer', aggregateId: offerId, payload: { offerId } });
      await this.audit.record({ action: 'offer.withdraw', entityType: 'offer', entityId: offerId, before: { status: offer.status }, after: { status: after.status } }, tx);
      return after;
    });
  }

  /** FR-56: dealer answers the customer's counter-offer. */
  async respondToCounter(ctx: DealerContext, offerId: string, dto: CounterResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.offer.findFirst({ where: { id: offerId, dealerId: ctx.dealerId } });
      if (!existing) throw Errors.notFound('Offer');
      const session = await this.lockSession(tx, existing.sessionId);
      const offer = await tx.offer.findUniqueOrThrow({ where: { id: offerId } });
      const counter = await tx.counterOffer.findFirst({ where: { offerId, status: CounterOfferStatus.OPEN }, orderBy: { createdAt: 'desc' } });
      if (!counter || offer.status !== OfferStatus.PENDING) throw Errors.conflict('NO_OPEN_COUNTER', 'There is no open counter-offer to respond to');
      if (session.acceptedOfferId || session.status === BiddingStatus.CANCELLED) throw Errors.conflict('BIDDING_FINISHED', 'This bidding process is finished');

      const now = new Date();
      await tx.counterOffer.update({
        where: { id: counter.id },
        data: { status: dto.accept ? CounterOfferStatus.ACCEPTED : CounterOfferStatus.DECLINED, respondedById: ctx.userId, respondedAt: now },
      });
      const after = await tx.offer.update({
        where: { id: offerId },
        data: dto.accept
          ? { amount: counter.amount, status: OfferStatus.UPDATED, expiresAt: new Date(now.getTime() + session.offerValidityHours * 3600_000), version: { increment: 1 } }
          : { status: offer.version > 0 ? OfferStatus.UPDATED : OfferStatus.SUBMITTED, version: { increment: 1 } },
      });
      await this.revision(tx, after, after.status, ctx.userId, dto.accept ? 'Customer counter-offer accepted by dealer' : `Counter-offer declined${dto.message ? `: ${dto.message}` : ''}`);
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.CounterOfferResponded,
        aggregateType: 'offer',
        aggregateId: offerId,
        payload: { offerId, counterOfferId: counter.id, accepted: dto.accept, message: dto.message ?? null },
      });
      await this.audit.record({ action: dto.accept ? 'offer.counter_accept' : 'offer.counter_decline', entityType: 'offer', entityId: offerId, before: { amount: offer.amount }, after: { amount: after.amount } }, tx);
      return after;
    });
  }

  async listOffersForDealer(ctx: DealerContext, query: DealerOfferQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.OfferWhereInput = { dealerId: ctx.dealerId, ...(query.status ? { status: query.status } : {}) };
    const [rows, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        include: {
          session: { select: { id: true, status: true, closesAt: true, sellRequest: { select: { reference: true, makeName: true, modelName: true, year: true, mileage: true, province: true } } } },
          counterOffers: { where: { status: CounterOfferStatus.OPEN } },
          deal: true,
        },
      }),
      this.prisma.offer.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  // ───────────── customer side ─────────────

  private async customerOffer(db: Db, userId: string, offerId: string) {
    const offer = await db.offer.findUnique({ where: { id: offerId }, include: { session: { include: { sellRequest: true } } } });
    if (!offer || offer.session.sellRequest.customerId !== userId) throw Errors.notFound('Offer');
    return offer;
  }

  async listMyOffers(userId: string, query: DealerOfferQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.OfferWhereInput = { session: { sellRequest: { customerId: userId } }, ...(query.status ? { status: query.status } : {}) };
    const [rows, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        orderBy: [{ status: 'asc' }, { amount: 'desc' }],
        skip,
        take,
        omit: { dealerNotes: true },
        include: {
          dealer: { select: { id: true, name: true, slug: true, logoUrl: true, rating: true } },
          session: { select: { id: true, status: true, allowCounterOffers: true, sellRequest: { select: { id: true, reference: true, makeName: true, modelName: true, year: true } } } },
          counterOffers: { orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.offer.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  /**
   * FR-54 / BR-11 / brief 5.2. Steps inside ONE transaction:
   *  lock session + offer → validate → accept → supersede competitors → award session →
   *  update sell request → create deal + dealer lead → audit + outbox. Notifications run after commit.
   * Safe to retry: accepting an offer you already accepted returns the existing deal.
   */
  async accept(userId: string, offerId: string) {
    const deal = await this.prisma.$transaction(
      async (tx) => {
        const initial = await this.customerOffer(tx, userId, offerId);
        const session = await this.lockSession(tx, initial.sessionId);
        await tx.$queryRaw(Prisma.sql`SELECT id FROM offers WHERE id = ${offerId}::uuid FOR UPDATE`);
        const offer = await tx.offer.findUniqueOrThrow({ where: { id: offerId } });

        if (offer.status === OfferStatus.ACCEPTED && session.acceptedOfferId === offer.id) {
          return tx.deal.findUniqueOrThrow({ where: { offerId } });
        }
        const check = checkAcceptable(offer, session);
        if (!check.ok) throw Errors.conflict(check.code, check.message);

        const now = new Date();
        const accepted = await tx.offer.update({ where: { id: offerId }, data: { status: OfferStatus.ACCEPTED, respondedAt: now, version: { increment: 1 } } });
        await this.revision(tx, accepted, OfferStatus.ACCEPTED, userId);
        await tx.counterOffer.updateMany({ where: { offerId, status: CounterOfferStatus.OPEN }, data: { status: CounterOfferStatus.CANCELLED } });

        const competitors = await tx.offer.findMany({ where: { sessionId: session.id, id: { not: offerId }, status: { in: ACTIVE_OFFER_STATUSES } } });
        for (const competitor of competitors) {
          const superseded = await tx.offer.update({ where: { id: competitor.id }, data: { status: OfferStatus.SUPERSEDED, respondedAt: now, version: { increment: 1 } } });
          await this.revision(tx, superseded, OfferStatus.SUPERSEDED, null, 'Another offer was accepted');
        }
        await tx.counterOffer.updateMany({ where: { offer: { sessionId: session.id }, status: CounterOfferStatus.OPEN }, data: { status: CounterOfferStatus.CANCELLED } });

        // acceptedOfferId is UNIQUE: a second concurrent acceptance would fail here even without the lock.
        await tx.biddingSession.update({
          where: { id: session.id },
          data: { status: BiddingStatus.AWARDED, acceptedOfferId: offerId, closedAt: now },
        });
        await tx.sellRequest.update({ where: { id: session.sellRequestId }, data: { status: SellRequestStatus.OFFER_ACCEPTED } });

        const request = session.sellRequest;
        const lead = await this.leads.createLead(
          tx,
          {
            dealerId: offer.dealerId,
            customerId: request.customerId,
            name: request.name,
            email: request.email,
            phone: request.phone,
            source: LeadSource.OFFER_ACCEPTED,
            stage: LeadStage.OFFER_SENT,
            note: `Customer accepted your offer of R${offer.amount.toLocaleString('en-ZA')} for ${request.year} ${request.makeName} ${request.modelName} (${request.reference})`,
          },
          userId,
        );
        const created = await tx.deal.create({
          data: { offerId, sellRequestId: request.id, dealerId: offer.dealerId, customerId: request.customerId, leadId: lead.id, amount: offer.amount },
        });

        await this.outbox.enqueue(tx, {
          type: OutboxEvents.OfferAccepted,
          aggregateType: 'offer',
          aggregateId: offerId,
          payload: { offerId, dealId: created.id, sessionId: session.id, supersededOfferIds: competitors.map((competitor) => competitor.id) },
        });
        await this.audit.record(
          { action: 'offer.accept', entityType: 'offer', entityId: offerId, before: { status: offer.status }, after: { status: OfferStatus.ACCEPTED, dealId: created.id, amount: offer.amount, superseded: competitors.length } },
          tx,
        );
        return created;
      },
      { timeout: 15_000 },
    );
    return { deal, offerId };
  }

  async reject(userId: string, offerId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const initial = await this.customerOffer(tx, userId, offerId);
      await this.lockSession(tx, initial.sessionId);
      const offer = await tx.offer.findUniqueOrThrow({ where: { id: offerId } });
      if (!ACTIVE_OFFER_STATUSES.includes(offer.status)) throw Errors.conflict('OFFER_NOT_ACTIVE', `Offer is ${offer.status}`);
      const after = await tx.offer.update({ where: { id: offerId }, data: { status: OfferStatus.REJECTED, respondedAt: new Date(), version: { increment: 1 } } });
      await tx.counterOffer.updateMany({ where: { offerId, status: CounterOfferStatus.OPEN }, data: { status: CounterOfferStatus.CANCELLED } });
      await this.revision(tx, after, OfferStatus.REJECTED, userId, reason);
      await this.outbox.enqueue(tx, { type: OutboxEvents.OfferRejected, aggregateType: 'offer', aggregateId: offerId, payload: { offerId, reason: reason ?? null } });
      await this.audit.record({ action: 'offer.reject', entityType: 'offer', entityId: offerId, before: { status: offer.status }, after: { status: after.status, reason } }, tx);
      return after;
    });
  }

  async counter(userId: string, offerId: string, dto: CounterOfferDto) {
    return this.prisma.$transaction(async (tx) => {
      const initial = await this.customerOffer(tx, userId, offerId);
      const session = await this.lockSession(tx, initial.sessionId);
      const offer = await tx.offer.findUniqueOrThrow({ where: { id: offerId } });
      if (!session.allowCounterOffers) throw Errors.conflict('COUNTER_NOT_ALLOWED', 'Counter-offers are not enabled for this bidding process');
      const check = checkAcceptable(offer, session);
      if (!check.ok) throw Errors.conflict(check.code, check.message);
      if (offer.status === OfferStatus.PENDING) throw Errors.conflict('COUNTER_PENDING', 'Wait for the dealer to answer your current counter-offer');
      if (dto.amount <= offer.amount) throw Errors.badRequest('COUNTER_TOO_LOW', 'A counter-offer must be higher than the current offer');

      const counter = await tx.counterOffer.create({ data: { offerId, amount: dto.amount, message: dto.message, createdById: userId } });
      const after = await tx.offer.update({ where: { id: offerId }, data: { status: OfferStatus.PENDING, version: { increment: 1 } } });
      await this.revision(tx, after, OfferStatus.PENDING, userId, `Customer countered with R${dto.amount.toLocaleString('en-ZA')}`);
      await this.outbox.enqueue(tx, { type: OutboxEvents.OfferCountered, aggregateType: 'offer', aggregateId: offerId, payload: { offerId, counterOfferId: counter.id } });
      await this.audit.record({ action: 'offer.counter', entityType: 'offer', entityId: offerId, after: { counterAmount: dto.amount } }, tx);
      return { offer: after, counter };
    });
  }

  // ───────────── scheduled jobs (worker) ─────────────

  async openScheduledSessions(): Promise<number> {
    const due = await this.prisma.biddingSession.findMany({ where: { status: BiddingStatus.SCHEDULED, opensAt: { lte: new Date() } }, select: { id: true }, take: 100 });
    for (const { id } of due) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.biddingSession.updateMany({ where: { id, status: BiddingStatus.SCHEDULED }, data: { status: BiddingStatus.OPEN } });
        if (updated.count) await this.outbox.enqueue(tx, { type: OutboxEvents.BiddingOpened, aggregateType: 'bidding_session', aggregateId: id, payload: { sessionId: id } });
      });
    }
    return due.length;
  }

  /** BR-07: windows close on time; offers stay acceptable until they expire. */
  async closeEndedSessions(): Promise<number> {
    const result = await this.prisma.biddingSession.updateMany({
      where: { status: BiddingStatus.OPEN, closesAt: { lte: new Date() } },
      data: { status: BiddingStatus.CLOSED, closedAt: new Date() },
    });
    return result.count;
  }

  /** FR-55 / BR-10: expire offers past their validity, keep them in history, notify both sides. */
  async expireOffers(): Promise<number> {
    const due = await this.prisma.offer.findMany({
      where: { status: { in: ACTIVE_OFFER_STATUSES }, expiresAt: { lte: new Date() } },
      select: { id: true },
      take: 500,
    });
    let expired = 0;
    for (const { id } of due) {
      await this.prisma.$transaction(async (tx) => {
        const offer = await tx.offer.findUniqueOrThrow({ where: { id } });
        const updated = await tx.offer.updateMany({
          where: { id, status: { in: ACTIVE_OFFER_STATUSES }, expiresAt: { lte: new Date() } },
          data: { status: OfferStatus.EXPIRED, version: { increment: 1 } },
        });
        if (!updated.count) return;
        expired++;
        await tx.counterOffer.updateMany({ where: { offerId: id, status: CounterOfferStatus.OPEN }, data: { status: CounterOfferStatus.CANCELLED } });
        await this.revision(tx, offer, OfferStatus.EXPIRED, null, 'Validity period ended');
        await this.outbox.enqueue(tx, { type: OutboxEvents.OfferExpired, aggregateType: 'offer', aggregateId: id, payload: { offerId: id } });
        await this.audit.record({ action: 'offer.expire', entityType: 'offer', entityId: id, before: { status: offer.status }, after: { status: OfferStatus.EXPIRED }, actorId: null, actorRole: 'SYSTEM' }, tx);
      });
    }
    if (expired) this.logger.log(`Expired ${expired} offers`);
    return expired;
  }

  /** Dealers eligible for a session, for "bidding opened" notifications. */
  async eligibleDealerIds(sessionId: string): Promise<string[]> {
    const session = await this.prisma.biddingSession.findUnique({ where: { id: sessionId }, include: { invites: { select: { dealerId: true } } } });
    if (!session) return [];
    const invites = session.invites.map((invite) => invite.dealerId);
    const dealers = await this.prisma.dealer.findMany({
      where: {
        status: 'APPROVED',
        biddingEnabled: true,
        ...(invites.length ? { id: { in: invites } } : {}),
        ...(session.eligibleProvinces.length ? { province: { in: session.eligibleProvinces } } : {}),
      },
      select: { id: true },
      take: 2000,
    });
    return dealers.map((dealer) => dealer.id);
  }

  static readonly participatePermission = DealerPermission.BIDDING_PARTICIPATE;
}
