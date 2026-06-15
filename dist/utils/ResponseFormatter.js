"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseFormatter = void 0;
class ResponseFormatter {
    static success(res, data, message = 'Success', statusCode = 200, path) {
        const response = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            path,
        };
        return res.status(statusCode).json(response);
    }
    static paginated(res, data, total, page, limit, message = 'Success', statusCode = 200, path) {
        const totalPages = Math.ceil(total / limit);
        const response = {
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
    static error(res, message, statusCode = 400, error, path) {
        const response = {
            success: false,
            message,
            error: process.env.NODE_ENV === 'production' ? undefined : error,
            timestamp: new Date().toISOString(),
            path,
        };
        return res.status(statusCode).json(response);
    }
    static validation(res, errors, message = 'Validation failed', path) {
        const response = {
            success: false,
            message,
            error: errors,
            timestamp: new Date().toISOString(),
            path,
        };
        return res.status(422).json(response);
    }
    static unauthorized(res, message = 'Unauthorized', path) {
        return this.error(res, message, 401, null, path);
    }
    static forbidden(res, message = 'Forbidden', path) {
        return this.error(res, message, 403, null, path);
    }
    static notFound(res, message = 'Resource not found', path) {
        return this.error(res, message, 404, null, path);
    }
    static conflict(res, message = 'Resource conflict', path) {
        return this.error(res, message, 409, null, path);
    }
    static internalError(res, message = 'Internal server error', error, path) {
        return this.error(res, message, 500, error, path);
    }
}
exports.ResponseFormatter = ResponseFormatter;
//# sourceMappingURL=ResponseFormatter.js.map