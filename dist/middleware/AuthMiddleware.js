"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorHandler_1 = require("@utils/ErrorHandler");
class AuthMiddleware {
    static verifyToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                throw new ErrorHandler_1.UnauthorizedError('Missing authorization token');
            }
            const parts = authHeader.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                throw new ErrorHandler_1.UnauthorizedError('Invalid authorization header format');
            }
            const token = parts[1];
            console.warn('⚠️  JWT token verification not yet implemented - add jwt library and configure token validation');
            next();
        }
        catch (error) {
            if (error instanceof ErrorHandler_1.UnauthorizedError) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, error.message, req.path);
            }
            else {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Invalid or expired token', req.path);
            }
        }
    }
    static optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return next();
            }
            const parts = authHeader.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                return next();
            }
            const token = parts[1];
            next();
        }
        catch (error) {
            next();
        }
    }
    static isAuthenticated(req) {
        return Boolean(req.user);
    }
    static requireRole(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'User not authenticated', req.path);
                return;
            }
            const hasRole = roles.some((role) => req.user?.roles.includes(role));
            if (!hasRole) {
                ResponseFormatter_1.ResponseFormatter.forbidden(res, `Required roles: ${roles.join(', ')}`, req.path);
                return;
            }
            next();
        };
    }
    static requirePermission(...permissions) {
        return (req, res, next) => {
            if (!req.user) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'User not authenticated', req.path);
                return;
            }
            const hasPermission = permissions.some((permission) => req.user?.permissions.includes(permission));
            if (!hasPermission) {
                ResponseFormatter_1.ResponseFormatter.forbidden(res, `Required permissions: ${permissions.join(', ')}`, req.path);
                return;
            }
            next();
        };
    }
    static pagination(req, res, next) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        req.pagination = { page, limit, offset };
        next();
    }
    static sorting(req, res, next) {
        const sortField = req.query.sortBy || 'createdAt';
        const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();
        if (!['ASC', 'DESC'].includes(sortOrder)) {
            ResponseFormatter_1.ResponseFormatter.error(res, 'Invalid sort order. Use ASC or DESC', 400, null, req.path);
            return;
        }
        req.sort = { field: sortField, order: sortOrder };
        next();
    }
}
exports.AuthMiddleware = AuthMiddleware;
exports.default = AuthMiddleware;
//# sourceMappingURL=AuthMiddleware.js.map