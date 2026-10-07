import { CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, Observable, of, switchMap, catchError, throwError } from 'rxjs';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Errors } from '../errors/app-error';
import { sha256 } from '../utils/strings';
import type { AuthUser } from '../types/auth-user';

export const IDEMPOTENT_KEY = 'idempotent';
/** Marks a mutation as retry-safe via the `Idempotency-Key` header. */
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);

const TTL_HOURS = 24;

/**
 * Stores the first response for (user, Idempotency-Key) and replays it for retries.
 * A concurrent duplicate gets 409 while the first request is still running.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const enabled = this.reflector.get<boolean>(IDEMPOTENT_KEY, context.getHandler());
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const key: string | undefined = request.headers['idempotency-key'];
    const user: AuthUser | undefined = request.user;
    if (!enabled || !key || !user) return next.handle();
    if (key.length > 128) throw Errors.badRequest('INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key is too long');

    const requestHash = sha256(JSON.stringify({ path: request.path, body: request.body ?? null }));

    return from(this.claim(user.id, key, request.method, request.path, requestHash)).pipe(
      switchMap((existing) => {
        if (existing) {
          response.status(existing.status);
          return of(existing.body);
        }
        return next.handle().pipe(
          switchMap((body) =>
            from(
              this.prisma.idempotencyKey.update({
                where: { userId_key: { userId: user.id, key } },
                data: { responseStatus: response.statusCode, responseBody: (body ?? null) as Prisma.InputJsonValue },
              }),
            ).pipe(switchMap(() => of(body))),
          ),
          catchError((error) =>
            from(this.prisma.idempotencyKey.deleteMany({ where: { userId: user.id, key } })).pipe(
              switchMap(() => throwError(() => error)),
            ),
          ),
        );
      }),
    );
  }

  private async claim(userId: string, key: string, method: string, path: string, requestHash: string) {
    try {
      await this.prisma.idempotencyKey.create({
        data: { userId, key, method, path, requestHash, expiresAt: new Date(Date.now() + TTL_HOURS * 3600_000) },
      });
      return null;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const row = await this.prisma.idempotencyKey.findUnique({ where: { userId_key: { userId, key } } });
      if (!row) throw Errors.conflict('IDEMPOTENCY_RETRY', 'Please retry the request');
      if (row.requestHash !== requestHash) {
        throw Errors.unprocessable('IDEMPOTENCY_KEY_REUSED', 'Idempotency-Key was already used with a different request');
      }
      if (row.responseStatus == null) {
        throw Errors.conflict('REQUEST_IN_PROGRESS', 'A request with this Idempotency-Key is still being processed');
      }
      return { status: row.responseStatus, body: row.responseBody };
    }
  }
}
