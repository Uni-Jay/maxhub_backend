"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorHandler_1 = require("@utils/ErrorHandler");
class ErrorMiddleware {
    static handle(err, req, res, next) {
        ErrorHandler_1.ErrorHandler.logError(err, `${req.method} ${req.path}`);
        if (ErrorHandler_1.ErrorHandler.isApiError(err)) {
            ResponseFormatter_1.ResponseFormatter.error(res, err.message, err.statusCode, err.errors || err.message, req.path);
            return;
        }
        if (err.name === 'SequelizeValidationError') {
            const errors = {};
            err.errors?.forEach((validationError) => {
                if (!errors[validationError.path]) {
                    errors[validationError.path] = [];
                }
                errors[validationError.path].push(validationError.message);
            });
            ResponseFormatter_1.ResponseFormatter.validation(res, errors, 'Validation failed', req.path);
            return;
        }
        if (err.name === 'SequelizeUniqueConstraintError') {
            const errors = {};
            err.errors?.forEach((uniqueError) => {
                if (!errors[uniqueError.path]) {
                    errors[uniqueError.path] = [];
                }
                errors[uniqueError.path].push(`${uniqueError.path} must be unique`);
            });
            ResponseFormatter_1.ResponseFormatter.error(res, 'Duplicate entry detected', 409, errors, req.path);
            return;
        }
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            ResponseFormatter_1.ResponseFormatter.error(res, 'Invalid reference: related record does not exist', 400, err.message, req.path);
            return;
        }
        if (err.name?.includes('Sequelize')) {
            ResponseFormatter_1.ResponseFormatter.internalError(res, 'Database operation failed', process.env.NODE_ENV === 'development' ? err.message : undefined, req.path);
            return;
        }
        if (err instanceof SyntaxError && 'body' in err) {
            ResponseFormatter_1.ResponseFormatter.error(res, 'Invalid JSON in request body', 400, err.message, req.path);
            return;
        }
        ResponseFormatter_1.ResponseFormatter.internalError(res, 'An unexpected error occurred', process.env.NODE_ENV === 'development' ? err.message : undefined, req.path);
    }
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    static notFound(req, res, next) {
        ResponseFormatter_1.ResponseFormatter.notFound(res, `Endpoint not found: ${req.method} ${req.path}`, req.path);
    }
}
exports.ErrorMiddleware = ErrorMiddleware;
exports.default = ErrorMiddleware;
//# sourceMappingURL=ErrorMiddleware.js.map