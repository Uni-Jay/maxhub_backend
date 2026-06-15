export declare class ApiError extends Error {
    statusCode: number;
    errors?: Record<string, string[]>;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, errors?: Record<string, string[]>);
}
export declare class ValidationError extends ApiError {
    constructor(message: string, errors?: Record<string, string[]>);
}
export declare class NotFoundError extends ApiError {
    constructor(resource?: string);
}
export declare class UnauthorizedError extends ApiError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ApiError {
    constructor(message?: string);
}
export declare class ConflictError extends ApiError {
    constructor(message?: string);
}
export declare class DuplicateEntryError extends ConflictError {
    constructor(field: string);
}
export declare class BadRequestError extends ApiError {
    constructor(message?: string);
}
export declare class DatabaseError extends ApiError {
    constructor(message: string, originalError?: Error);
}
export declare class BusinessLogicError extends ApiError {
    constructor(message: string);
}
export declare class ErrorHandler {
    static isApiError(error: any): error is ApiError;
    static asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>): (req: any, res: any, next: any) => void;
    static logError(error: any, context?: string): void;
    static getErrorResponse(error: any): {
        message: string;
        statusCode: number;
        errors: Record<string, string[]> | undefined;
    };
}
export default ErrorHandler;
//# sourceMappingURL=ErrorHandler.d.ts.map