import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import {
  DealerMemberRole,
  EnquiryStatus,
  OfferStatus,
  Prisma,
  SellRequestStatus,
  SubscriberStatus,
  UserStatus,
} from '../../generated/prisma/client';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import { randomToken } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { toPublicUser } from '../auth/auth.service';
import { pickCriteria } from '../search/dto/search.dto';
import { POPULARITY } from '../vehicles/public-vehicles.service';
import { PUBLIC_DETAIL_STATUSES } from '../vehicles/vehicle-lifecycle';
import { publicVehicleSelect, withAvailability } from '../vehicles/vehicle.presenter';
import { CreateSavedSearchDto, UpdateProfileDto, UpdateSavedSearchDto } from './dto/customer.dto';

const MAX_SAVED_SEARCHES = 25;
const ACTIVE_OFFERS: OfferStatus[] = [OfferStatus.SUBMITTED, OfferStatus.UPDATED, OfferStatus.PENDING];

/** Registered-customer features: profile, favourites, saved searches, history, dashboard, privacy. */
@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ───────────── profile (FR-01) ─────────────

  async profile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { ...toPublicUser(user), youtubeProfileUrl: user.youtubeProfileUrl, facebookProfileUrl: user.facebookProfileUrl, instagramProfileUrl: user.instagramProfileUrl, linkedInProfileUrl: user.linkedInProfileUrl, marketingConsent: user.marketingConsent, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const before = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    let after;
    try {
      after = await this.prisma.user.update({ where: { id: userId }, data: {
        ...dto, ...(dto.email !== undefined && dto.email !== before.email ? { emailVerifiedAt: null } : {}),
      } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw Errors.conflict('EMAIL_IN_USE', 'This email is already registered');
      throw error;
    }
    await this.audit.record({
      action: 'user.profile_update',
      entityType: 'user',
      entityId: userId,
      before: { firstName: before.firstName, lastName: before.lastName, phone: before.phone, marketingConsent: before.marketingConsent },
      after: dto,
    });
    return this.profile(after.id);
  }

  /** Security settings (FR-40): active sessions/devices. */
  async sessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: { id: true, userAgent: true, ip: true, createdAt: true, lastUsedAt: true, expiresAt: true },
    });
    return sessions.map((session) => ({ ...session, current: session.id === currentSessionId }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const result = await this.prisma.session.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!result.count) throw Errors.notFound('Session');
  }

  // ───────────── favourites (FR-37) ─────────────

  async favourites(userId: string, query: { page?: number; pageSize?: number }) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where = { userId };
    const [rows, total] = await Promise.all([
      this.prisma.favourite.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { vehicle: { select: publicVehicleSelect } } }),
      this.prisma.favourite.count({ where }),
    ]);
    return toPage(rows.map((row) => ({ savedAt: row.createdAt, vehicle: { ...withAvailability(row.vehicle), isFavourite: true } })), total, page, pageSize);
  }

  async favouriteIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.favourite.findMany({ where: { userId }, select: { vehicleId: true }, take: 1000 });
    return rows.map((row) => row.vehicleId);
  }

  async addFavourite(userId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { status: true } });
    if (!vehicle || !PUBLIC_DETAIL_STATUSES.includes(vehicle.status)) throw Errors.notFound('Vehicle');
    await this.prisma.$transaction(async (tx) => {
      const created = await tx.favourite.createMany({ data: [{ userId, vehicleId }], skipDuplicates: true });
      if (created.count) {
        await tx.vehicle.update({ where: { id: vehicleId }, data: { favouriteCount: { increment: 1 }, popularityScore: { increment: POPULARITY.favourite } } });
      }
    });
    return { vehicleId, saved: true };
  }

  async removeFavourite(userId: string, vehicleId: string) {
    await this.prisma.$transaction(async (tx) => {
      const removed = await tx.favourite.deleteMany({ where: { userId, vehicleId } });
      if (removed.count) {
        await tx.vehicle.update({ where: { id: vehicleId }, data: { favouriteCount: { decrement: 1 }, popularityScore: { decrement: POPULARITY.favourite } } });
      }
    });
    return { vehicleId, saved: false };
  }

  // ───────────── saved searches (FR-38) ─────────────

  savedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async createSavedSearch(userId: string, dto: CreateSavedSearchDto) {
    const count = await this.prisma.savedSearch.count({ where: { userId } });
    if (count >= MAX_SAVED_SEARCHES) throw Errors.conflict('LIMIT_REACHED', `You can keep up to ${MAX_SAVED_SEARCHES} saved searches`);
    const criteria = pickCriteria(dto.criteria);
    if (!Object.keys(criteria).length) throw Errors.badRequest('EMPTY_SEARCH', 'Choose at least one filter to save a search');
    return this.prisma.savedSearch.create({
      data: { userId, name: dto.name, criteria: criteria as Prisma.InputJsonValue, alertsEnabled: dto.alertsEnabled ?? true },
    });
  }

  async updateSavedSearch(userId: string, id: string, dto: UpdateSavedSearchDto) {
    const existing = await this.prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!existing) throw Errors.notFound('Saved search');
    return this.prisma.savedSearch.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.alertsEnabled !== undefined ? { alertsEnabled: dto.alertsEnabled } : {}),
        ...(dto.criteria ? { criteria: pickCriteria(dto.criteria) as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async deleteSavedSearch(userId: string, id: string) {
    const result = await this.prisma.savedSearch.deleteMany({ where: { id, userId } });
    if (!result.count) throw Errors.notFound('Saved search');
  }

  // ───────────── recently viewed (FR-41) ─────────────

  async recentlyViewed(userId: string, limit = 20) {
    const rows = await this.prisma.recentlyViewed.findMany({
      where: { userId, vehicle: { status: { in: PUBLIC_DETAIL_STATUSES } } },
      orderBy: { viewedAt: 'desc' },
      take: Math.min(50, limit),
      include: { vehicle: { select: publicVehicleSelect } },
    });
    return rows.map((row) => ({ viewedAt: row.viewedAt, vehicle: withAvailability(row.vehicle) }));
  }

  async clearRecentlyViewed(userId: string) {
    const result = await this.prisma.recentlyViewed.deleteMany({ where: { userId } });
    return { cleared: result.count };
  }

  // ───────────── dashboard (FR-40) ─────────────

  async dashboard(userId: string) {
    const [profile, openEnquiries, enquiries, sellRequests, activeOffers, favourites, savedSearches, unread, recent] = await Promise.all([
      this.profile(userId),
      this.prisma.enquiry.count({ where: { customerId: userId, status: { in: [EnquiryStatus.NEW, EnquiryStatus.IN_PROGRESS, EnquiryStatus.RESPONDED] } } }),
      this.prisma.enquiry.findMany({
        where: { customerId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, reference: true, type: true, status: true, createdAt: true, updatedAt: true, vehicle: { select: { title: true, slug: true } }, dealer: { select: { name: true } } },
      }),
      this.prisma.sellRequest.findMany({
        where: { customerId: userId, status: { notIn: [SellRequestStatus.CANCELLED] } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, reference: true, type: true, status: true, year: true, makeName: true, modelName: true, valuations: { orderBy: { createdAt: 'desc' }, take: 1, select: { estimateLow: true, estimateMid: true, estimateHigh: true } } },
      }),
      this.prisma.offer.count({ where: { status: { in: ACTIVE_OFFERS }, session: { sellRequest: { customerId: userId } } } }),
      this.prisma.favourite.count({ where: { userId } }),
      this.prisma.savedSearch.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
      this.recentlyViewed(userId, 5),
    ]);
    return {
      profile,
      counts: { openEnquiries, activeOffers, favourites, savedSearches, unreadNotifications: unread },
      latestEnquiries: enquiries,
      sellRequests,
      recentlyViewed: recent,
    };
  }

  // ───────────── privacy (NFR-17) ─────────────

  /** Everything we hold about the customer, as one JSON document. */
  async exportData(userId: string) {
    const [user, enquiries, sellRequests, favourites, savedSearches, preferences, subscriber] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, omit: { passwordHash: true } }),
      this.prisma.enquiry.findMany({ where: { customerId: userId }, include: { responses: true } }),
      this.prisma.sellRequest.findMany({ where: { customerId: userId }, include: { valuations: true } }),
      this.prisma.favourite.findMany({ where: { userId } }),
      this.prisma.savedSearch.findMany({ where: { userId } }),
      this.prisma.notificationPreference.findMany({ where: { userId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }).then((row) => (row ? this.prisma.newsletterSubscriber.findUnique({ where: { email: row.email } }) : null)),
    ]);
    await this.audit.record({ action: 'user.data_export', entityType: 'user', entityId: userId });
    return { exportedAt: new Date().toISOString(), user, enquiries, sellRequests, favourites, savedSearches, notificationPreferences: preferences, newsletter: subscriber };
  }

  /**
   * Account deletion: personal data is anonymised, personal lists are removed and every session
   * is revoked. Records needed for completed transactions (deals) keep only their business fields.
   */
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { dealerMember: true } });
    if (!(await bcrypt.compare(password, user.passwordHash))) throw Errors.badRequest('INVALID_PASSWORD', 'Password is incorrect');
    if (user.dealerMember?.role === DealerMemberRole.OWNER) {
      throw Errors.conflict('DEALER_OWNER', 'Dealership owners must contact support to close the dealership first');
    }
    const anonymous = { name: 'Deleted user', email: `deleted+${userId}@invalid.changecars`, phone: '' };
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymous.email,
          firstName: 'Deleted',
          lastName: 'User',
          phone: null,
          youtubeProfileUrl: null, facebookProfileUrl: null, instagramProfileUrl: null, linkedInProfileUrl: null,
          passwordHash: await bcrypt.hash(randomToken(), 10),
          status: UserStatus.DELETED,
          deletedAt: new Date(),
          marketingConsent: false,
        },
      });
      await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.favourite.deleteMany({ where: { userId } });
      await tx.savedSearch.deleteMany({ where: { userId } });
      await tx.recentlyViewed.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.notificationPreference.deleteMany({ where: { userId } });
      await tx.enquiry.updateMany({ where: { customerId: userId }, data: anonymous });
      await tx.sellRequest.updateMany({
        where: { customerId: userId, deals: { none: {} } },
        data: { ...anonymous, registrationNumber: null, vin: null },
      });
      await tx.newsletterSubscriber.updateMany({ where: { email: user.email }, data: { status: SubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() } });
      if (user.dealerMember) await tx.dealerMember.update({ where: { id: user.dealerMember.id }, data: { status: 'DISABLED' } });
      await this.audit.record({ action: 'user.delete_account', entityType: 'user', entityId: userId }, tx);
    });
  }

}
