import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Business error with a stable, machine-readable code. Clients branch on `code`,
 * never on `message`.
 */
export class AppError extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}

export const Errors = {
  badRequest: (code: string, message: string, details?: unknown) =>
    new AppError(HttpStatus.BAD_REQUEST, code, message, details),
  unauthorized: (code = 'UNAUTHORIZED', message = 'Authentication required') =>
    new AppError(HttpStatus.UNAUTHORIZED, code, message),
  forbidden: (code = 'FORBIDDEN', message = 'You do not have permission to perform this action') =>
    new AppError(HttpStatus.FORBIDDEN, code, message),
  notFound: (entity: string, code?: string) =>
    new AppError(HttpStatus.NOT_FOUND, code ?? `${entity.toUpperCase().replace(/[^A-Z]+/g, '_')}_NOT_FOUND`, `${entity} not found`),
  conflict: (code: string, message: string, details?: unknown) =>
    new AppError(HttpStatus.CONFLICT, code, message, details),
  unprocessable: (code: string, message: string, details?: unknown) =>
    new AppError(HttpStatus.UNPROCESSABLE_ENTITY, code, message, details),
  tooMany: (code = 'RATE_LIMITED', message = 'Too many requests') =>
    new AppError(HttpStatus.TOO_MANY_REQUESTS, code, message),
};
