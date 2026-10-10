import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';
import { requestContext } from '../../common/context/request-context';
import { Errors } from '../../common/errors/app-error';
import type { AccessTokenPayload } from '../../common/types/auth-user';
import { normalizeEmail, randomToken, sha256 } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import type { Db } from '../../infrastructure/database';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { ChangePasswordDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

export interface PublicUser {
  id: string;
  username: string | null;
  accountType: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
}

export interface AuthTokens {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: PublicUser;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  username: user.username,
  accountType: user.accountType,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  role: user.role,
});

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Compared against when the email is unknown so login timing does not reveal accounts. */
  private readonly dummyHash: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {
    this.dummyHash = bcrypt.hashSync(randomToken(), this.config.get('BCRYPT_ROUNDS'));
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.get('BCRYPT_ROUNDS'));
  }

  /** Creates a user row (used by customer sign-up and dealer registration). */
  async createUser(
    db: Db,
    input: Pick<RegisterDto, 'email' | 'password' | 'firstName' | 'lastName'> & { username?: string; accountType?: 'PRIVATE_SELLER' | 'DEALER'; acceptTerms?: boolean; phone?: string; marketingConsent?: boolean; role?: UserRole },
  ): Promise<User> {
    const email = normalizeEmail(input.email);
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw Errors.conflict('EMAIL_TAKEN', 'An account with this email already exists');
    if (input.username) {
      const taken = await db.user.findUnique({ where: { username: input.username.trim().toLowerCase() }, select: { id: true } });
      if (taken) throw Errors.conflict('USERNAME_TAKEN', 'This username is already taken');
    }
    let user: User;
    try {
      user = await db.user.create({
      data: {
        email,
        username: input.username?.trim().toLowerCase(),
        accountType: input.role === UserRole.DEALER ? 'DEALER' : input.accountType ?? 'PRIVATE_SELLER',
        passwordHash: await this.hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role ?? UserRole.CUSTOMER,
        marketingConsent: input.marketingConsent ?? false,
        termsAcceptedAt: input.acceptTerms ? new Date() : null,
      },
    });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        const target = (error as { meta?: { target?: string[] } }).meta?.target ?? [];
        if (target.includes('username')) throw Errors.conflict('USERNAME_TAKEN', 'This username is already taken');
        throw Errors.conflict('EMAIL_TAKEN', 'An account with this email already exists');
      }
      throw error;
    }
    await this.outbox.enqueue(db, {
      type: OutboxEvents.UserRegistered,
      aggregateType: 'user',
      aggregateId: user.id,
      payload: { userId: user.id },
    });
    return user;
  }

  async register(dto: import('./dto/auth.dto').CustomerRegisterDto): Promise<AuthTokens> {
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await this.createUser(tx, { ...dto, role: dto.accountType === 'DEALER' ? UserRole.DEALER : UserRole.CUSTOMER });
      await this.audit.record({ action: 'auth.register', entityType: 'user', entityId: created.id, actorId: created.id, actorRole: created.role }, tx);
      return created;
    });
    return this.issueTokens(user);
  }

  async login(emailInput: string, password: string): Promise<AuthTokens> {
    const email = normalizeEmail(emailInput);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? this.dummyHash);

    if (!user || !valid) {
      await this.audit.record({ action: 'auth.login_failed', entityType: 'user', entityId: user?.id ?? null, after: { email }, actorId: null, actorRole: null });
      throw Errors.unauthorized('INVALID_CREDENTIALS', 'Email or password is incorrect');
    }
    if (user.status !== UserStatus.ACTIVE) {
      await this.audit.record({ action: 'auth.login_blocked', entityType: 'user', entityId: user.id, after: { status: user.status }, actorId: user.id, actorRole: user.role });
      throw Errors.forbidden('ACCOUNT_DISABLED', 'This account is not active');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.record({ action: 'auth.login', entityType: 'user', entityId: user.id, actorId: user.id, actorRole: user.role });
    return this.issueTokens(user);
  }

  /** Rotates the refresh token. Re-use of a rotated token revokes the whole session family. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const session = await this.prisma.session.findUnique({ where: { tokenHash: sha256(refreshToken) }, include: { user: true } });
    if (!session) throw Errors.unauthorized('INVALID_REFRESH_TOKEN', 'Refresh token is invalid');

    if (session.revokedAt) {
      await this.prisma.session.updateMany({ where: { familyId: session.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit.record({ action: 'auth.refresh_token_reuse', entityType: 'session', entityId: session.id, actorId: session.userId, actorRole: session.user.role });
      this.logger.warn(`Refresh token reuse detected for user ${session.userId}; session family revoked`);
      throw Errors.unauthorized('INVALID_REFRESH_TOKEN', 'Refresh token is invalid');
    }
    if (session.expiresAt < new Date()) throw Errors.unauthorized('REFRESH_TOKEN_EXPIRED', 'Session expired, please sign in again');
    if (session.user.status !== UserStatus.ACTIVE) throw Errors.forbidden('ACCOUNT_DISABLED', 'This account is not active');

    // Conditional update makes concurrent refreshes with the same token safe: only one wins.
    const tokens = await this.prisma.$transaction(async (tx) => {
      const next = await this.createSession(tx, session.user, session.familyId);
      const revoked = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date(), replacedById: next.sessionId, lastUsedAt: new Date() },
      });
      if (revoked.count !== 1) throw Errors.unauthorized('INVALID_REFRESH_TOKEN', 'Refresh token is invalid');
      return next;
    });
    return this.buildTokens(session.user, tokens);
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async logoutAll(userId: string, db: Db = this.prisma): Promise<void> {
    await db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  /** Always succeeds so the endpoint cannot be used to discover accounts. */
  async forgotPassword(emailInput: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(emailInput) } });
    if (!user || user.status !== UserStatus.ACTIVE) return;

    const token = randomToken();
    const ttlMinutes = this.config.get('PASSWORD_RESET_TTL_MINUTES');
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
      await tx.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMinutes * 60_000) },
      });
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.PasswordResetRequested,
        aggregateType: 'user',
        aggregateId: user.id,
        payload: { userId: user.id, token, ttlMinutes },
      });
      await this.audit.record({ action: 'auth.password_reset_requested', entityType: 'user', entityId: user.id, actorId: null, actorRole: null }, tx);
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(dto.token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw Errors.badRequest('INVALID_RESET_TOKEN', 'This reset link is invalid or has expired');
    }
    const passwordHash = await this.hashPassword(dto.password);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
      if (claimed.count !== 1) throw Errors.badRequest('INVALID_RESET_TOKEN', 'This reset link is invalid or has expired');
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await this.logoutAll(record.userId, tx);
      await this.audit.record({ action: 'auth.password_reset', entityType: 'user', entityId: record.userId, actorId: record.userId, actorRole: null }, tx);
    });
  }

  async changePassword(userId: string, currentSessionId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw Errors.badRequest('INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
    }
    const passwordHash = await this.hashPassword(dto.newPassword);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      // Sign out every other device; keep the current session.
      await tx.session.updateMany({ where: { userId, revokedAt: null, id: { not: currentSessionId } }, data: { revokedAt: new Date() } });
      await this.audit.record({ action: 'auth.password_changed', entityType: 'user', entityId: userId }, tx);
    });
  }

  async issueTokens(user: User): Promise<AuthTokens> {
    const session = await this.createSession(this.prisma, user, randomUUID());
    return this.buildTokens(user, session);
  }

  private async createSession(db: Db, user: User, familyId: string) {
    const refreshToken = randomToken(48);
    const expiresAt = new Date(Date.now() + this.config.get('REFRESH_TOKEN_TTL_DAYS') * 86_400_000);
    const ctx = requestContext();
    const session = await db.session.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        familyId,
        expiresAt,
        ip: ctx.ip,
        userAgent: ctx.userAgent?.slice(0, 500),
      },
    });
    return { sessionId: session.id, refreshToken, expiresAt };
  }

  private async buildTokens(user: User, session: { sessionId: string; refreshToken: string; expiresAt: Date }): Promise<AuthTokens> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role, sid: session.sessionId };
    const expiresIn = this.config.get('JWT_ACCESS_TTL_SECONDS');
    return {
      tokenType: 'Bearer',
      accessToken: await this.jwt.signAsync(payload, { expiresIn }),
      expiresIn,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt.toISOString(),
      user: toPublicUser(user),
    };
  }
}
