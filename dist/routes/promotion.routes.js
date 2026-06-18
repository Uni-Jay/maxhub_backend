"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmployeePromotion_model_1 = require("../models/EmployeePromotion.model");
const Staff_model_1 = require("../models/Staff.model");
const idOrUuid_1 = require("../utils/idOrUuid");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const PermissionCodes_1 = require("../config/PermissionCodes");
const router = (0, express_1.Router)();
router.get('/', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_READ_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where = {};
    if (status)
        where.status = status;
    const promotions = await EmployeePromotion_model_1.EmployeePromotion.findAll({
        where,
        include: [
            { model: Staff_model_1.Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
            { association: 'fromDesignation', attributes: ['id', 'name'] },
            { association: 'toDesignation', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, promotions);
}));
router.post('/', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_CREATE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { staffId, toDesignationId, toDepartmentId, effectiveDate, reason, salaryIncreasePercentage, newSalary } = req.body;
    if (!staffId || !toDesignationId || !effectiveDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'staffId, toDesignationId and effectiveDate are required', 400);
    }
    const staff = await Staff_model_1.Staff.findByPk(staffId);
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff not found');
    const promotion = await EmployeePromotion_model_1.EmployeePromotion.create({
        staffId: BigInt(staffId),
        fromDesignationId: staff.designationId,
        toDesignationId: BigInt(toDesignationId),
        fromDepartmentId: staff.departmentId,
        toDepartmentId: toDepartmentId ? BigInt(toDepartmentId) : staff.departmentId,
        effectiveDate: new Date(effectiveDate),
        reason,
        promotedBy: BigInt(req.user.id),
        salaryIncreasePercentage: salaryIncreasePercentage ? Number(salaryIncreasePercentage) : undefined,
        newSalary: newSalary ? Number(newSalary) : undefined,
        status: 'Proposed',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, promotion, 'Promotion proposed', 201);
}));
router.patch('/:id/approve', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_APPROVE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const promotion = await EmployeePromotion_model_1.EmployeePromotion.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!promotion)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Promotion not found');
    if (promotion.status !== 'Proposed') {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only proposed promotions can be approved', 400);
    }
    await promotion.update({
        status: 'Effective',
        approvalDate: new Date(),
        approvalRemarks: req.body.approvalRemarks,
    });
    const staff = await Staff_model_1.Staff.findByPk(promotion.staffId);
    if (staff) {
        await staff.update({
            designationId: promotion.toDesignationId,
            ...(promotion.toDepartmentId && { departmentId: promotion.toDepartmentId }),
        });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, promotion, 'Promotion approved and applied');
}));
router.patch('/:id/reject', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_APPROVE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const promotion = await EmployeePromotion_model_1.EmployeePromotion.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!promotion)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Promotion not found');
    if (promotion.status !== 'Proposed') {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only proposed promotions can be rejected', 400);
    }
    await promotion.update({
        status: 'Rejected',
        rejectionReason: req.body.rejectionReason,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, promotion, 'Promotion rejected');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_DELETE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const promotion = await EmployeePromotion_model_1.EmployeePromotion.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!promotion)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Promotion not found');
    await promotion.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Promotion deleted');
}));
exports.default = router;
//# sourceMappingURL=promotion.routes.js.map