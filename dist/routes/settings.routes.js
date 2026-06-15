"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
exports.default = (0, express_1.Router)()
    .get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {});
}))
    .patch('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Settings updated');
}));
//# sourceMappingURL=settings.routes.js.map