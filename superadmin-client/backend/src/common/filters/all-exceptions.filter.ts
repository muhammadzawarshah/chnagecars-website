import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Prisma } from '../../generated/prisma/client';
import { requestContext } from '../context/request-context';
import { AppError } from '../errors/app-error';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
  path: string;
}

/**
 * One error shape for every failure:
 * { statusCode, code, message, details?, requestId, timestamp, path }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const { status, code, message, details } = this.normalize(exception);

    if (status >= 500) {
      this.logger.error({ err: exception, path: request?.url }, 'Unhandled error');
    }

    const body: ErrorBody = {
      statusCode: status,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      requestId: requestContext().requestId ?? request?.id,
      timestamp: new Date().toISOString(),
      path: request?.url,
    };
    response.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; code: string; message: string; details?: unknown } {
    if (exception instanceof AppError) {
      return { status: exception.getStatus(), code: exception.code, message: exception.message, details: exception.details };
    }
    if (exception instanceof ThrottlerException) {
      return { status: HttpStatus.TOO_MANY_REQUESTS, code: 'RATE_LIMITED', message: 'Too many requests, please slow down' };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as string | { message?: string | string[]; error?: string };
      if (typeof res === 'object' && Array.isArray(res.message)) {
        return { status, code: 'VALIDATION_FAILED', message: 'Request validation failed', details: res.message };
      }
      const message = typeof res === 'string' ? res : (res.message as string) ?? exception.message;
      return { status, code: HttpStatus[status] ?? 'HTTP_ERROR', message };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return { status: HttpStatus.CONFLICT, code: 'UNIQUE_CONSTRAINT', message: 'A record with these values already exists', details: exception.meta?.target };
        case 'P2025':
          return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Record not found' };
        case 'P2003':
          return { status: HttpStatus.CONFLICT, code: 'FOREIGN_KEY_CONSTRAINT', message: 'Related record does not exist or is still referenced' };
        case 'P2034':
          return { status: HttpStatus.CONFLICT, code: 'CONCURRENT_UPDATE', message: 'The record was changed by another request, please retry' };
      }
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };
  }
}
