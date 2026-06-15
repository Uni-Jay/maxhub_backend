/**
 * Custom API Error class
 * Extends Error to include HTTP status code and additional metadata
 */
export class ApiError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    errors?: Record<string, string[]>
  ) {
    super(message, 422, errors);
    this.name = 'ValidationError';
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Duplicate Entry Error
 */
export class DuplicateEntryError extends ConflictError {
  constructor(field: string) {
    super(`${field} already exists`);
    this.name = 'DuplicateEntryError';
  }
}

/**
 * Bad Request Error
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

/**
 * Database Error
 */
export class DatabaseError extends ApiError {
  constructor(message: string, originalError?: Error) {
    super(message, 500);
    this.name = 'DatabaseError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Business Logic Error
 */
export class BusinessLogicError extends ApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  /**
   * Check if error is an API error
   */
  static isApiError(error: any): error is ApiError {
    return error instanceof ApiError;
  }

  /**
   * Wrap async route handlers to catch errors
   */
  static asyncHandler(
    fn: (
      req: any,
      res: any,
      next: any
    ) => Promise<any>
  ) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';

    if (this.isApiError(error)) {
      console.error(
        `[${timestamp}] ${error.name}${contextStr}: ${error.message} (Status: ${error.statusCode})`
      );
    } else {
      console.error(
        `[${timestamp}] Unexpected Error${contextStr}: ${error?.message || JSON.stringify(error)}`
      );
    }

    if (process.env.NODE_ENV !== 'production' && error?.stack) {
      console.error(error.stack);
    }
  }

  /**
   * Get error response data
   */
  static getErrorResponse(error: any) {
    if (this.isApiError(error)) {
      return {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
      };
    }

    return {
      message: 'Internal server error',
      statusCode: 500,
      errors: undefined,
    };
  }
}

export default ErrorHandler;
