import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Public } from '../../common/decorators/auth.decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthService, toPublicUser } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RefreshTokenDto, CustomerRegisterDto, ResetPasswordDto } from './dto/auth.dto';

/** Strict limits on credential endpoints (NFR-04, brief section 11). */
const AUTH_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('register')
  @ApiOperation({ summary: 'Create a customer account (FR-01)' })
  register(@Body() dto: CustomerRegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for new tokens (rotation)' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(@CurrentUser() user: AuthUser) {
    await this.auth.logout(user.sessionId);
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke every session of the current user' })
  async logoutAll(@CurrentUser() user: AuthUser) {
    await this.auth.logoutAll(user.id);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Email a password reset link (always returns 202)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { message: 'If an account exists for this email, a reset link has been sent' };
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set a new password with a reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change password and sign out other devices' })
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.id, user.sessionId, dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Current user with dealer membership, if any' })
  async me(@CurrentUser() user: AuthUser) {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { dealerMember: { include: { dealer: { select: { id: true, name: true, slug: true, status: true } } } } },
    });
    return {
      ...toPublicUser(record),
      dealer: record.dealerMember
        ? { ...record.dealerMember.dealer, memberId: record.dealerMember.id, memberRole: record.dealerMember.role, branchId: record.dealerMember.branchId }
        : null,
    };
  }
}
