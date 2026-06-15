"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.BusinessLogicError = exports.DatabaseError = exports.BadRequestError = exports.DuplicateEntryError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, statusCode = 500, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
class ValidationError extends ApiError {
    constructor(message, errors) {
        super(message, 422, errors);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ApiError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends ApiError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends ApiError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class DuplicateEntryError extends ConflictError {
    constructor(field) {
        super(`${field} already exists`);
        this.name = 'DuplicateEntryError';
    }
}
exports.DuplicateEntryError = DuplicateEntryError;
class BadRequestError extends ApiError {
    constructor(message = 'Bad request') {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
class DatabaseError extends ApiError {
    constructor(message, originalError) {
        super(message, 500);
        this.name = 'DatabaseError';
        if (originalError) {
            this.stack = originalError.stack;
        }
    }
}
exports.DatabaseError = DatabaseError;
class BusinessLogicError extends ApiError {
    constructor(message) {
        super(message, 400);
        this.name = 'BusinessLogicError';
    }
}
exports.BusinessLogicError = BusinessLogicError;
class ErrorHandler {
    static isApiError(error) {
        return error instanceof ApiError;
    }
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    static logError(error, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` [${context}]` : '';
        if (this.isApiError(error)) {
            console.error(`[${timestamp}] ${error.name}${contextStr}: ${error.message} (Status: ${error.statusCode})`);
        }
        else {
            console.error(`[${timestamp}] Unexpected Error${contextStr}: ${error?.message || JSON.stringify(error)}`);
        }
        if (process.env.NODE_ENV !== 'production' && error?.stack) {
            console.error(error.stack);
        }
    }
    static getErrorResponse(error) {
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
exports.ErrorHandler = ErrorHandler;
exports.default = ErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map