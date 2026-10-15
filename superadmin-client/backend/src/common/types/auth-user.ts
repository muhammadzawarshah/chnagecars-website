import type { UserRole } from '../../generated/prisma/client';

/** The authenticated principal attached to each request by JwtAuthGuard. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  sid: string;
}
