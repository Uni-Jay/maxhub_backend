import { Response } from 'express';
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
    timestamp: string;
    path?: string;
}
interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
    pagination: PaginationMeta;
}
export declare class ResponseFormatter {
    static success<T>(res: Response, data: T, message?: string, statusCode?: number, path?: string): Response;
    static paginated<T>(res: Response, data: T[], total: number, page: number, limit: number, message?: string, statusCode?: number, path?: string): Response;
    static error(res: Response, message: string, statusCode?: number, error?: any, path?: string): Response;
    static validation(res: Response, errors: Record<string, string[]>, message?: string, path?: string): Response;
    static unauthorized(res: Response, message?: string, path?: string): Response;
    static forbidden(res: Response, message?: string, path?: string): Response;
    static notFound(res: Response, message?: string, path?: string): Response;
    static conflict(res: Response, message?: string, path?: string): Response;
    static internalError(res: Response, message?: string, error?: any, path?: string): Response;
}
export { ApiResponse, PaginatedApiResponse, PaginationMeta };
//# sourceMappingURL=ResponseFormatter.d.ts.map