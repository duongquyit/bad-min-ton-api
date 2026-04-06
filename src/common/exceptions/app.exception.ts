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
  constructor(errorCode = 'error.BAD_REQUEST') {
    super(errorCode, HttpStatus.BAD_REQUEST);
  }
}

export class ValidationException extends AppException {
  constructor(errorCode = 'error.VALIDATION') {
    super(errorCode, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class ResourceNotFoundException extends AppException {
  constructor(errorCode = 'error.NOT_FOUND') {
    super(errorCode, HttpStatus.NOT_FOUND);
  }
}

export class ResourceConflictException extends AppException {
  constructor(errorCode = 'error.CONFLICT') {
    super(errorCode, HttpStatus.CONFLICT);
  }
}

export class UnauthorizedException extends AppException {
  constructor(errorCode = 'error.UNAUTHORIZED') {
    super(errorCode, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends AppException {
  constructor(errorCode = 'error.FORBIDDEN') {
    super(errorCode, HttpStatus.FORBIDDEN);
  }
}

export class DatabaseException extends AppException {
  constructor(errorCode = 'error.DATABASE') {
    super(errorCode, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
