"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.paginated(res, [], 0, req.pagination?.page || 1, req.pagination?.limit || 20);
}));
router.post('/check-in', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Check-in recorded successfully', 201);
}));
router.post('/check-out', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Check-out recorded successfully');
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {});
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Attendance updated successfully');
}));
router.get('/staff/:staffId/monthly', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        records: [],
        summary: {
            present: 0,
            absent: 0,
            leave: 0,
            halfDay: 0,
        },
    });
}));
exports.default = router;
//# sourceMappingURL=attendance.routes.js.map