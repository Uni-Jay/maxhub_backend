"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.paginated(res, [], 0, req.pagination?.page || 1, req.pagination?.limit || 20);
}));
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Task created successfully', 201);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {});
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Task updated successfully');
}));
router.patch('/:id/status', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Task status updated');
}));
router.patch('/:id/assign', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Task assigned successfully');
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Task deleted successfully');
}));
exports.default = router;
//# sourceMappingURL=task.routes.js.map