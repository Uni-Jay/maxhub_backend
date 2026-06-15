import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorHandler, ApiError } from '@utils/ErrorHandler';

/**
 * Error handling middleware for Express
 * Catches all errors thrown in route handlers and sends standardized error responses
 */
export class ErrorMiddleware {
  /**
   * Global error handler middleware
   * Must be registered LAST in middleware chain
   */
  static handle(
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Log the error
    ErrorHandler.logError(err, `${req.method} ${req.path}`);

    // Handle API errors
    if (ErrorHandler.isApiError(err)) {
      ResponseFormatter.error(
        res,
        err.message,
        err.statusCode,
        err.errors || err.message,
        req.path
      );
      return;
    }

    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const errors: Record<string, string[]> = {};
      (err as any).errors?.forEach((validationError: any) => {
        if (!errors[validationError.path]) {
          errors[validationError.path] = [];
        }
        errors[validationError.path].push(validationError.message);
      });
      ResponseFormatter.validation(res, errors, 'Validation failed', req.path);
      return;
    }

    // Handle Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      const errors: Record<string, string[]> = {};
      (err as any).errors?.forEach((uniqueError: any) => {
        if (!errors[uniqueError.path]) {
          errors[uniqueError.path] = [];
        }
        errors[uniqueError.path].push(`${uniqueError.path} must be unique`);
      });
      ResponseFormatter.error(
        res,
        'Duplicate entry detected',
        409,
        errors,
        req.path
      );
      return;
    }

    // Handle Sequelize foreign key constraint errors
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      ResponseFormatter.error(
        res,
        'Invalid reference: related record does not exist',
        400,
        err.message,
        req.path
      );
      return;
    }

    // Handle generic database errors
    if (err.name?.includes('Sequelize')) {
      ResponseFormatter.internalError(
        res,
        'Database operation failed',
        process.env.NODE_ENV === 'development' ? err.message : undefined,
        req.path
      );
      return;
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
      ResponseFormatter.error(
        res,
        'Invalid JSON in request body',
        400,
        err.message,
        req.path
      );
      return;
    }

    // Default: Internal server error
    ResponseFormatter.internalError(
      res,
      'An unexpected error occurred',
      process.env.NODE_ENV === 'development' ? err.message : undefined,
      req.path
    );
  }

  /**
   * Wrapper for async route handlers to catch errors
   * Usage: app.get('/route', ErrorMiddleware.asyncHandler(async (req, res) => { ... }))
   */
  static asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 404 Not Found middleware
   * Should be registered BEFORE error handler
   */
  static notFound(req: Request, res: Response, next: NextFunction): void {
    ResponseFormatter.notFound(
      res,
      `Endpoint not found: ${req.method} ${req.path}`,
      req.path
    );
  }
}

export default ErrorMiddleware;
