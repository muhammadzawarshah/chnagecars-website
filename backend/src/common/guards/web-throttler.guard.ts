import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { isIP } from 'node:net';
import { timingSafeEqual } from 'node:crypto';

const KEY_HEADER = 'x-web-adapter-key';
const CLIENT_IP_HEADER = 'x-web-client-ip';

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Rate limits per shopper even when calls arrive through the Next.js website server.
 * The website forwards the visitor's IP in X-Web-Client-Ip together with the shared
 * WEB_ADAPTER_KEY; without a valid key the header is ignored and the socket/proxy IP is used,
 * so nobody can dodge the limit by sending a fake client IP.
 */
@Injectable()
export class WebAwareThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    const expected = process.env.WEB_ADAPTER_KEY;
    const headers = (req.headers ?? {}) as Record<string, string | string[] | undefined>;
    const key = headers[KEY_HEADER];
    const clientIp = headers[CLIENT_IP_HEADER];
    if (expected && typeof key === 'string' && typeof clientIp === 'string' && isIP(clientIp.trim()) && sameSecret(key, expected)) {
      return `web:${clientIp.trim()}`;
    }
    return super.getTracker(req);
  }
}
