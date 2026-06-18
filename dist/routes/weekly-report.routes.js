"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const WeeklyReport_model_1 = require("../models/WeeklyReport.model");
const Staff_model_1 = require("../models/Staff.model");
const idOrUuid_1 = require("../utils/idOrUuid");
const isSuperAdmin_1 = require("../utils/isSuperAdmin");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
function getThisFridayISO() {
    const now = new Date();
    const diff = (5 - now.getDay() + 7) % 7;
    const friday = new Date(now);
    friday.setDate(now.getDate() + diff);
    return friday.toISOString().slice(0, 10);
}
async function getStaffId(req) {
    const staff = await Staff_model_1.Staff.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
    return staff ? staff.id : null;
}
router.get('/current', AuthMiddleware_1.default.requirePermission('hr.weeklyreport.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staffId = await getStaffId(req);
    if (!staffId)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'No staff profile linked to this account');
    const report = await WeeklyReport_model_1.WeeklyReport.findOne({ where: { staffId, weekEnding: getThisFridayISO() } });
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'No report for this week yet');
    ResponseFormatter_1.ResponseFormatter.success(res, report);
}));
router.get('/', AuthMiddleware_1.default.requirePermission('hr.weeklyreport.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const where = {};
    if (!(0, isSuperAdmin_1.isSuperAdmin)(req)) {
        const staffId = await getStaffId(req);
        if (!staffId)
            return ResponseFormatter_1.ResponseFormatter.success(res, []);
        where.staffId = staffId;
    }
    const reports = await WeeklyReport_model_1.WeeklyReport.findAll({
        where,
        include: [{ model: Staff_model_1.Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName'] }],
        order: [['weekEnding', 'DESC']],
        limit: 50,
    });
    const mapped = reports.map((r) => ({
        id: r.id,
        weekEnding: r.weekEnding,
        status: 'Submitted',
        summary: r.accomplishments,
        submittedAt: r.createdAt,
        approvalStatus: r.approvalStatus,
        approvedBy: r.approvedById ? `User #${r.approvedById}` : undefined,
        rejectionReason: r.rejectionReason,
        staffName: r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : undefined,
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, mapped);
}));
router.post('/', AuthMiddleware_1.default.requirePermission('hr.weeklyreport.create.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staffId = await getStaffId(req);
    if (!staffId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'No staff profile linked to this account', 400);
    const { weekEnding, accomplishments, challenges, nextWeekPlans, hoursWorked, hasBlocker, blockerNotes, taskStatus, attachments } = req.body;
    if (!accomplishments || !challenges || !nextWeekPlans) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'accomplishments, challenges, nextWeekPlans are required', 400);
    }
    const effectiveWeekEnding = weekEnding || getThisFridayISO();
    const existing = await WeeklyReport_model_1.WeeklyReport.findOne({ where: { staffId, weekEnding: effectiveWeekEnding } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.conflict(res, 'You already submitted a report for this week');
    const report = await WeeklyReport_model_1.WeeklyReport.create({
        uuid: (0, uuid_1.v4)(), staffId, weekEnding: effectiveWeekEnding,
        accomplishments, challenges, nextWeekPlans,
        hoursWorked: hoursWorked ? Number(hoursWorked) : undefined,
        hasBlocker: !!hasBlocker, blockerNotes, taskStatus, attachments,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Weekly report submitted', 201);
}));
router.patch('/:id/approve', AuthMiddleware_1.default.requireRole('superadmin'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const report = await WeeklyReport_model_1.WeeklyReport.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Weekly report not found');
    await report.update({
        approvalStatus: 'Approved', approvedById: req.user.id, approvedDate: new Date(), rejectionReason: null,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Weekly report approved');
}));
router.patch('/:id/reject', AuthMiddleware_1.default.requireRole('superadmin'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const report = await WeeklyReport_model_1.WeeklyReport.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Weekly report not found');
    const { rejectionReason } = req.body;
    await report.update({
        approvalStatus: 'Rejected', approvedById: req.user.id, approvedDate: new Date(), rejectionReason,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Weekly report rejected');
}));
exports.default = router;
//# sourceMappingURL=weekly-report.routes.js.map