import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { IS_PUBLIC_KEY, OPTIONAL_AUTH_KEY } from '../decorators/auth.decorators';
import { Errors } from '../errors/app-error';
import type { AccessTokenPayload, AuthUser } from '../types/auth-user';

/**
 * Global guard. Every route requires a valid access token unless marked @Public()
 * or @OptionalAuth(). Access tokens are short-lived; revocation happens at refresh.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    const isOptional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, targets);

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;

    if (!token) {
      if (isPublic || isOptional) return true;
      throw Errors.unauthorized();
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      const user: AuthUser = { id: payload.sub, email: payload.email, role: payload.role, sessionId: payload.sid };
      request.user = user;
      if (this.cls.isActive()) this.cls.set('user', user);
      return true;
    } catch {
      if (isPublic) return true;
      throw Errors.unauthorized('INVALID_TOKEN', 'Access token is invalid or expired');
    }
  }
}
