import { Response } from 'express';

/**
 * Standard API Response Format
 */
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  timestamp: string;
  path?: string;
}

/**
 * Pagination metadata
 */
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated API Response
 */
interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * ResponseFormatter - Standardized API response utility
 * Ensures consistent response format across all endpoints
 */
export class ResponseFormatter {
  /**
   * Send success response with data
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    path?: string
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated success response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success',
    statusCode: number = 200,
    path?: string
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const response: PaginatedApiResponse<T> = {
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      timestamp: new Date().toISOString(),
      path,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    error?: any,
    path?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error: process.env.NODE_ENV === 'production' ? undefined : error,
      timestamp: new Date().toISOString(),
      path,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  static validation(
    res: Response,
    errors: Record<string, string[]>,
    message: string = 'Validation failed',
    path?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error: errors,
      timestamp: new Date().toISOString(),
      path,
    };
    return res.status(422).json(response);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized',
    path?: string
  ): Response {
    return this.error(res, message, 401, null, path);
  }

  /**
   * Send forbidden response
   */
  static forbidden(
    res: Response,
    message: string = 'Forbidden',
    path?: string
  ): Response {
    return this.error(res, message, 403, null, path);
  }

  /**
   * Send not found response
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found',
    path?: string
  ): Response {
    return this.error(res, message, 404, null, path);
  }

  /**
   * Send conflict response
   */
  static conflict(
    res: Response,
    message: string = 'Resource conflict',
    path?: string
  ): Response {
    return this.error(res, message, 409, null, path);
  }

  /**
   * Send internal server error response
   */
  static internalError(
    res: Response,
    message: string = 'Internal server error',
    error?: any,
    path?: string
  ): Response {
    return this.error(res, message, 500, error, path);
  }
}

export { ApiResponse, PaginatedApiResponse, PaginationMeta };
