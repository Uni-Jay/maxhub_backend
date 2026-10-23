"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const FeeReceipt_model_1 = require("../models/FeeReceipt.model");
const Enrollment_model_1 = require("../models/Enrollment.model");
const Course_model_1 = require("../models/Course.model");
const Staff_model_1 = require("../models/Staff.model");
const StudentProfile_model_1 = require("../models/StudentProfile.model");
const User_model_1 = require("../models/User.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
function getDeptScope(req, allPermission) {
    const user = req.user;
    const normRoles = (user.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    if (normRoles.includes('superadmin') || normRoles.includes('admin') || normRoles.includes('headofadmin')) {
        return { scoped: false, departmentId: null };
    }
    const perms = new Set((user.permissions || []).map((p) => p.toLowerCase()));
    if (perms.has(allPermission.toLowerCase())) {
        return { scoped: false, departmentId: null };
    }
    return { scoped: true, departmentId: user.departmentId ?? null };
}
function generateReceiptNumber() {
    const year = new Date().getFullYear();
    return `REC-${year}-${Date.now().toString(36).toUpperCase()}`;
}
router.get('/', AuthMiddleware_1.default.requirePermission('LMS.FEE_RECEIPT.READ.ALL', 'LMS.FEE_RECEIPT.READ.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const scope = getDeptScope(req, 'lms.fee_receipt.read.all');
    const courseWhere = {};
    if (scope.scoped) {
        if (!scope.departmentId)
            return ResponseFormatter_1.ResponseFormatter.success(res, []);
        courseWhere.departmentId = scope.departmentId;
    }
    const receipts = await FeeReceipt_model_1.FeeReceipt.findAll({
        include: [{
                model: Enrollment_model_1.Enrollment, as: 'enrollment', required: true,
                include: [
                    { model: Course_model_1.Course, as: 'course', where: courseWhere, attributes: ['id', 'title', 'courseCode'] },
                    { model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email'] }] },
                    { model: StudentProfile_model_1.StudentProfile, as: 'student', include: [{ model: User_model_1.User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
                ],
            }],
        order: [['paymentDate', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, receipts);
}));
router.post('/', AuthMiddleware_1.default.requirePermission('LMS.FEE_RECEIPT.CREATE.ALL', 'LMS.FEE_RECEIPT.CREATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { enrollmentId, amountPaid, paymentMethod, paymentDate, session, balanceRemaining, status, notes } = req.body;
    if (!enrollmentId || !amountPaid || !paymentMethod || !paymentDate || !session) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'enrollmentId, amountPaid, paymentMethod, paymentDate and session are required', 400);
    }
    const enrollment = await Enrollment_model_1.Enrollment.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(enrollmentId) } });
    if (!enrollment)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Enrollment not found', 404);
    const course = await Course_model_1.Course.findByPk(enrollment.courseId);
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const scope = getDeptScope(req, 'lms.fee_receipt.create.all');
    if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only issue fee receipts for students in your own department', 403);
    }
    const priorPaid = Number((await FeeReceipt_model_1.FeeReceipt.sum('amountPaid', { where: { enrollmentId: enrollment.id } })) || 0);
    const cumulativePaid = priorPaid + Number(amountPaid);
    const balance = Math.max(Number(balanceRemaining) || 0, 0);
    const effectiveTotalFee = cumulativePaid + balance;
    await enrollment.update({ totalFee: effectiveTotalFee });
    const receipt = await FeeReceipt_model_1.FeeReceipt.create({
        uuid: (0, uuid_1.v4)(), enrollmentId: enrollment.id, receiptNumber: generateReceiptNumber(),
        amountPaid: Number(amountPaid), paymentMethod, paymentDate, session, balance,
        status: status || (balance <= 0 ? 'Paid' : 'PartPayment'), notes, issuedById: req.user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...receipt.toJSON(), totalFee: effectiveTotalFee, totalPaid: cumulativePaid }, 'Fee receipt issued', 201);
}));
router.get('/:id', AuthMiddleware_1.default.requirePermission('LMS.FEE_RECEIPT.READ.ALL', 'LMS.FEE_RECEIPT.READ.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const receipt = await FeeReceipt_model_1.FeeReceipt.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [{
                model: Enrollment_model_1.Enrollment, as: 'enrollment',
                include: [
                    { model: Course_model_1.Course, as: 'course', attributes: ['id', 'title', 'courseCode', 'departmentId'] },
                    { model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email'] }] },
                    { model: StudentProfile_model_1.StudentProfile, as: 'student', include: [{ model: User_model_1.User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
                ],
            }],
    });
    if (!receipt)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Fee receipt not found', 404);
    const scope = getDeptScope(req, 'lms.fee_receipt.read.all');
    if (scope.scoped) {
        const course = receipt.enrollment?.course;
        if (!course || String(course.departmentId) !== String(scope.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only view fee receipts for students in your own department', 403);
        }
    }
    ResponseFormatter_1.ResponseFormatter.success(res, receipt);
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('LMS.FEE_RECEIPT.DELETE.ALL', 'LMS.FEE_RECEIPT.DELETE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const receipt = await FeeReceipt_model_1.FeeReceipt.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [{ model: Enrollment_model_1.Enrollment, as: 'enrollment', include: [{ model: Course_model_1.Course, as: 'course', attributes: ['id', 'departmentId'] }] }],
    });
    if (!receipt)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Fee receipt not found', 404);
    const scope = getDeptScope(req, 'lms.fee_receipt.delete.all');
    if (scope.scoped) {
        const course = receipt.enrollment?.course;
        if (!course || String(course.departmentId) !== String(scope.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only delete fee receipts for students in your own department', 403);
        }
    }
    const enrollment = receipt.enrollment;
    await receipt.destroy();
    const remaining = await FeeReceipt_model_1.FeeReceipt.findAll({ where: { enrollmentId: enrollment.id }, order: [['paymentDate', 'ASC'], ['id', 'ASC']] });
    const totalFee = Number(enrollment.totalFee) || 0;
    let running = 0;
    for (const r of remaining) {
        running += Number(r.amountPaid);
        await r.update({ balance: Math.max(totalFee - running, 0) });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Fee receipt deleted');
}));
exports.default = router;
//# sourceMappingURL=fee-receipt.routes.js.map