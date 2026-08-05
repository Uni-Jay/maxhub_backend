"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmployeePromotion_model_1 = require("@models/EmployeePromotion.model");
const Staff_model_1 = require("@models/Staff.model");
const Designation_model_1 = require("@models/Designation.model");
const Department_model_1 = require("@models/Department.model");
const idOrUuid_1 = require("@utils/idOrUuid");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const PermissionCodes_1 = require("@config/PermissionCodes");
const CommunicationService_1 = require("@services/CommunicationService");
const router = (0, express_1.Router)();
function isBypassRole(req) {
    const roles = (req.user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    return roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin');
}
function hasPermission(req, code) {
    if (isBypassRole(req))
        return true;
    const perms = new Set((req.user?.permissions || []).map((p) => String(p).toLowerCase()));
    return perms.has(code.toLowerCase());
}
function isDepartmentScopedOnly(req, allCode, deptCode) {
    return !hasPermission(req, allCode) && hasPermission(req, deptCode);
}
function isSuperAdminOnly(req) {
    const roles = (req.user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    return roles.includes('superadmin');
}
async function getOwnStaff(req) {
    const userId = req.user?.id;
    if (!userId)
        return null;
    return Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id', 'departmentId'] });
}
router.get('/', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_READ_ALL, PermissionCodes_1.PermissionCode.HR_PROMOTION_READ_OWN_DEPARTMENT), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where = {};
    if (status)
        where.status = status;
    const staffInclude = { model: Staff_model_1.Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'employeeId'] };
    if (isDepartmentScopedOnly(req, PermissionCodes_1.PermissionCode.HR_PROMOTION_READ_ALL, PermissionCodes_1.PermissionCode.HR_PROMOTION_READ_OWN_DEPARTMENT)) {
        const ownStaff = await getOwnStaff(req);
        staffInclude.where = { departmentId: ownStaff?.departmentId ?? -1 };
        staffInclude.required = true;
    }
    const promotions = await EmployeePromotion_model_1.EmployeePromotion.findAll({
        where,
        include: [
            staffInclude,
            { association: 'fromDesignation', attributes: ['id', 'name'] },
            { association: 'toDesignation', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, promotions);
}));
router.post('/', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_CREATE_ALL, PermissionCodes_1.PermissionCode.HR_PROMOTION_CREATE_OWN_DEPARTMENT), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { staffId, toDesignationId, toDepartmentId, effectiveDate, reason, salaryIncreasePercentage, newSalary } = req.body;
    if (!staffId || !toDesignationId || !effectiveDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'staffId, toDesignationId and effectiveDate are required', 400);
    }
    const staff = await Staff_model_1.Staff.findByPk(staffId);
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff not found');
    const deptScopedCreate = isDepartmentScopedOnly(req, PermissionCodes_1.PermissionCode.HR_PROMOTION_CREATE_ALL, PermissionCodes_1.PermissionCode.HR_PROMOTION_CREATE_OWN_DEPARTMENT);
    if (deptScopedCreate) {
        const ownStaff = await getOwnStaff(req);
        if (String(ownStaff?.id) === String(staffId)) {
            return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You cannot recommend yourself for promotion', req.path);
        }
        if (!ownStaff?.departmentId || String(staff.departmentId) !== String(ownStaff.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You can only recommend staff in your own department', req.path);
        }
    }
    const promotion = await EmployeePromotion_model_1.EmployeePromotion.create({
        staffId: BigInt(staffId),
        fromDesignationId: staff.designationId,
        toDesignationId: BigInt(toDesignationId),
        fromDepartmentId: staff.departmentId,
        toDepartmentId: (!deptScopedCreate && toDepartmentId) ? BigInt(toDepartmentId) : staff.departmentId,
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
    if (!isSuperAdminOnly(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only Super Admin can approve promotions', req.path);
    }
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
        const [designation, department] = await Promise.all([
            promotion.toDesignationId ? Designation_model_1.Designation.findByPk(promotion.toDesignationId, { attributes: ['name'] }) : null,
            promotion.toDepartmentId ? Department_model_1.Department.findByPk(promotion.toDepartmentId, { attributes: ['name'] }) : null,
        ]);
        if (staff.email) {
            (0, CommunicationService_1.sendPromotionEmail)({
                to: staff.email,
                firstName: staff.firstName,
                lastName: staff.lastName,
                newDesignation: designation?.name,
                newDepartment: department?.name,
                effectiveDate: promotion.effectiveDate,
                approvalRemarks: req.body.approvalRemarks,
            }).catch(err => console.error('[Promotion] Approval email failed:', err));
        }
    }
    ResponseFormatter_1.ResponseFormatter.success(res, promotion, 'Promotion approved, applied, and the staff member has been notified');
}));
router.patch('/:id/reject', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_APPROVE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdminOnly(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only Super Admin can reject promotions', req.path);
    }
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