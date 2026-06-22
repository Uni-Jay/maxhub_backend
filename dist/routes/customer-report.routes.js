"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CustomerReport_model_1 = require("../models/CustomerReport.model");
const Staff_model_1 = require("../models/Staff.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
function isManagerRole(req) {
    const roles = (req.user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    return ['superadmin', 'admin', 'headofadmin', 'hr', 'hod'].some((r) => roles.includes(r));
}
function isCeoRole(req) {
    const roles = (req.user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    return roles.includes('superadmin');
}
async function getUnitScope(req) {
    if (isCeoRole(req))
        return { scoped: false, units: [] };
    const staff = await Staff_model_1.Staff.findOne({ where: { userId: req.user.id }, attributes: ['businessUnit', 'businessUnits'] });
    const units = new Set();
    if (staff?.businessUnit)
        units.add(staff.businessUnit);
    for (const u of staff?.businessUnits || [])
        units.add(u);
    return { scoped: true, units: [...units] };
}
router.get('/', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where = {};
    if (status)
        where.approvalStatus = status;
    const scope = await getUnitScope(req);
    if (scope.scoped) {
        if (!scope.units.length)
            return ResponseFormatter_1.ResponseFormatter.success(res, []);
        where.businessUnit = scope.units;
    }
    const reports = await CustomerReport_model_1.CustomerReport.findAll({ where, order: [['createdAt', 'DESC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, reports);
}));
router.post('/', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { clientName, clientPhone, clientEmail, assignedStaff, servicePurchased, department, businessUnit, currentStatus, pendingActions, completedActions, totalAmount, amountPaid, outstandingBalance, attachments, approvalStatus, submittedBy, noteText, } = req.body;
    if (!clientName || !servicePurchased || !businessUnit) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'clientName, servicePurchased and businessUnit are required', 400);
    }
    const notes = noteText ? [{ date: new Date().toISOString().slice(0, 10), text: noteText, author: submittedBy || user.email }] : [];
    const report = await CustomerReport_model_1.CustomerReport.create({
        clientName, clientPhone, clientEmail, assignedStaff, servicePurchased, department, businessUnit,
        currentStatus, pendingActions, completedActions,
        totalAmount: totalAmount || 0, amountPaid: amountPaid || 0, outstandingBalance: outstandingBalance || 0,
        attachments: attachments || [],
        notes,
        approvalStatus: approvalStatus === 'Submitted' ? 'Submitted' : 'Draft',
        submittedBy: approvalStatus === 'Submitted' ? (submittedBy || user.email) : undefined,
        submittedAt: approvalStatus === 'Submitted' ? new Date() : undefined,
        createdById: user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Customer report created', 201);
}));
router.patch('/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const report = await CustomerReport_model_1.CustomerReport.findByPk(req.params.id);
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Customer report not found');
    const { clientName, clientPhone, clientEmail, assignedStaff, servicePurchased, department, businessUnit, currentStatus, pendingActions, completedActions, totalAmount, amountPaid, outstandingBalance, attachments, noteText, approvalStatus, } = req.body;
    const updates = {
        clientName, clientPhone, clientEmail, assignedStaff, servicePurchased, department, businessUnit,
        currentStatus, pendingActions, completedActions, totalAmount, amountPaid, outstandingBalance, attachments,
    };
    for (const k of Object.keys(updates))
        if (updates[k] === undefined)
            delete updates[k];
    const user = req.user;
    if (noteText) {
        const existingNotes = report.notes || [];
        updates.notes = [...existingNotes, { date: new Date().toISOString().slice(0, 10), text: noteText, author: user.email }];
    }
    if (approvalStatus === 'Submitted' && report.approvalStatus === 'Draft') {
        updates.approvalStatus = 'Submitted';
        updates.submittedBy = user.email;
        updates.submittedAt = new Date();
    }
    await report.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Customer report updated');
}));
router.patch('/:id/submit', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const report = await CustomerReport_model_1.CustomerReport.findByPk(req.params.id);
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Customer report not found');
    if (report.approvalStatus !== 'Draft') {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only draft reports can be submitted', 400);
    }
    await report.update({ approvalStatus: 'Submitted', submittedBy: user.email, submittedAt: new Date() });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Report submitted for review');
}));
router.patch('/:id/approve', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isManagerRole(req))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only managers can approve customer reports', req.path);
    const user = req.user;
    const report = await CustomerReport_model_1.CustomerReport.findByPk(req.params.id);
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Customer report not found');
    await report.update({ approvalStatus: 'Approved', approvedBy: user.email, approvedAt: new Date() });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Report approved');
}));
router.patch('/:id/reject', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isManagerRole(req))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only managers can reject customer reports', req.path);
    const report = await CustomerReport_model_1.CustomerReport.findByPk(req.params.id);
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Customer report not found');
    await report.update({ approvalStatus: 'Rejected', rejectionReason: req.body.reason });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Report rejected');
}));
router.patch('/:id/revision', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isManagerRole(req))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only managers can request revisions', req.path);
    const report = await CustomerReport_model_1.CustomerReport.findByPk(req.params.id);
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Customer report not found');
    await report.update({ approvalStatus: 'Revision Requested', revisionNote: req.body.reason });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Revision requested');
}));
router.patch('/:id/archive', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const report = await CustomerReport_model_1.CustomerReport.findByPk(req.params.id);
    if (!report)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Customer report not found');
    await report.update({ approvalStatus: 'Archived' });
    ResponseFormatter_1.ResponseFormatter.success(res, report, 'Report archived');
}));
exports.default = router;
//# sourceMappingURL=customer-report.routes.js.map