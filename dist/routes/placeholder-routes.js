"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = exports.permissionRoutes = exports.roleRoutes = exports.notificationRoutes = exports.messageRoutes = exports.trainingRoutes = exports.appraisalRoutes = exports.warehouseRoutes = exports.inventoryRoutes = exports.invoiceRoutes = exports.payrollRoutes = exports.jobApplicationRoutes = exports.jobPostingRoutes = exports.enrollmentRoutes = exports.courseRoutes = exports.opportunityRoutes = exports.contactRoutes = exports.designationRoutes = exports.departmentRoutes = void 0;
const express_1 = require("express");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
exports.departmentRoutes = (0, express_1.Router)();
exports.departmentRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.designationRoutes = (0, express_1.Router)();
exports.designationRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.contactRoutes = (0, express_1.Router)();
exports.contactRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.opportunityRoutes = (0, express_1.Router)();
exports.opportunityRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.courseRoutes = (0, express_1.Router)();
exports.courseRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.enrollmentRoutes = (0, express_1.Router)();
exports.enrollmentRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.jobPostingRoutes = (0, express_1.Router)();
exports.jobPostingRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.jobApplicationRoutes = (0, express_1.Router)();
exports.jobApplicationRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.payrollRoutes = (0, express_1.Router)();
exports.payrollRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.invoiceRoutes = (0, express_1.Router)();
exports.invoiceRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.inventoryRoutes = (0, express_1.Router)();
exports.inventoryRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.warehouseRoutes = (0, express_1.Router)();
exports.warehouseRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.appraisalRoutes = (0, express_1.Router)();
exports.appraisalRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.trainingRoutes = (0, express_1.Router)();
exports.trainingRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.messageRoutes = (0, express_1.Router)();
exports.messageRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.notificationRoutes = (0, express_1.Router)();
exports.notificationRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.roleRoutes = (0, express_1.Router)();
exports.roleRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.permissionRoutes = (0, express_1.Router)();
exports.permissionRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.settingsRoutes = (0, express_1.Router)();
exports.settingsRoutes.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, {});
}));
exports.default = router;
//# sourceMappingURL=placeholder-routes.js.map