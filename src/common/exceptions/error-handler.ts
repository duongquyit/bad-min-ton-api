import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { AppException } from './app.exception';
import { t } from '../i18n';

export interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const lang = I18nContext.current(host)?.lang ?? 'en';

    let status: HttpStatus;
    let errorCode: string;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = this.statusToErrorCode(status);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'error.INTERNAL';
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const message = t(errorCode, lang);

    const body: ErrorResponse = {
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private statusToErrorCode(status: HttpStatus): string {
    const map: Partial<Record<HttpStatus, string>> = {
      [HttpStatus.NOT_FOUND]: 'error.NOT_FOUND',
      [HttpStatus.CONFLICT]: 'error.CONFLICT',
      [HttpStatus.UNAUTHORIZED]: 'error.UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'error.FORBIDDEN',
      [HttpStatus.BAD_REQUEST]: 'error.BAD_REQUEST',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'error.VALIDATION',
    };
    return map[status] ?? 'error.INTERNAL';
  }
}
