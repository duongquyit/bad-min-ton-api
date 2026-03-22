import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception for all application-level errors.
 * Carries an `errorCode` that maps to an i18n translation key (e.g. "error.NOT_FOUND").
 * The global HttpExceptionFilter translates this key before sending the response.
 */
export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    status: HttpStatus,
  ) {
    super(errorCode, status);
  }
}

export class BadRequestException extends AppException {
  constructor() {
    super('error.BAD_REQUEST', HttpStatus.BAD_REQUEST);
  }
}

export class ValidationException extends AppException {
  constructor() {
    super('error.VALIDATION', HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class ResourceNotFoundException extends AppException {
  constructor() {
    super('error.NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class ResourceConflictException extends AppException {
  constructor() {
    super('error.CONFLICT', HttpStatus.CONFLICT);
  }
}

export class UnauthorizedException extends AppException {
  constructor() {
    super('error.UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends AppException {
  constructor() {
    super('error.FORBIDDEN', HttpStatus.FORBIDDEN);
  }
}

export class DatabaseException extends AppException {
  constructor() {
    super('error.DATABASE', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
