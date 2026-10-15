import { CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';

export const PUBLIC_CACHE_KEY = 'http:publicCache';

/**
 * Marks anonymous GET responses as cacheable by the CDN for `seconds` (shared cache) so the
 * bulk of browse/search traffic never reaches the API or database. Responses to signed-in
 * requests are always private.
 */
export const PublicCache = (seconds: number) => SetMetadata(PUBLIC_CACHE_KEY, seconds);

@Injectable()
export class CacheHeadersInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const seconds = this.reflector.getAllAndOverride<number | undefined>(PUBLIC_CACHE_KEY, [context.getHandler(), context.getClass()]);

    return next.handle().pipe(
      tap(() => {
        if (response.headersSent || response.getHeader('Cache-Control')) return;
        const anonymous = !request.headers.authorization;
        if (request.method === 'GET' && anonymous && seconds) {
          response.setHeader('Cache-Control', `public, max-age=${Math.min(seconds, 60)}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`);
          response.setHeader('Vary', 'Accept-Encoding');
        } else {
          response.setHeader('Cache-Control', 'private, no-store');
        }
      }),
    );
  }
}
