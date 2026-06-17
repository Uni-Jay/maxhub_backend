"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const LeaveRequest_model_1 = require("../models/LeaveRequest.model");
const LeaveBalance_model_1 = require("../models/LeaveBalance.model");
const LeaveType_model_1 = require("../models/LeaveType.model");
const Staff_model_1 = require("../models/Staff.model");
const router = (0, express_1.Router)();
router.get('/requests', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.status)
        where.status = req.query.status;
    if (req.query.staffId)
        where.staffId = BigInt(req.query.staffId);
    const { count, rows } = await LeaveRequest_model_1.LeaveRequest.findAndCountAll({
        where,
        include: [
            {
                model: Staff_model_1.Staff,
                as: 'staff',
                attributes: ['id', 'firstName', 'lastName', 'employeeId'],
                required: false,
            },
            {
                model: LeaveType_model_1.LeaveType,
                as: 'leaveType',
                attributes: ['id', 'name', 'color'],
                required: false,
            },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        paranoid: true,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
}));
router.post('/requests', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { leaveTypeId, startDate, endDate, reason, documentUrl } = req.body;
    const user = req.user;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const numberofDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const leave = await LeaveRequest_model_1.LeaveRequest.create({
        leaveTypeId: BigInt(leaveTypeId),
        staffId: BigInt(user?.staffId || 1),
        startDate: start,
        endDate: end,
        numberofDays,
        reason,
        documentUrl,
        status: 'Pending',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, leave.toJSON(), 'Leave request submitted successfully', 201);
}));
router.get('/requests/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const leave = await LeaveRequest_model_1.LeaveRequest.findByPk(req.params.id, {
        include: [
            { model: Staff_model_1.Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName'] },
            { model: LeaveType_model_1.LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color'] },
        ],
    });
    if (!leave)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Leave request not found');
    ResponseFormatter_1.ResponseFormatter.success(res, leave.toJSON());
}));
router.patch('/requests/:id/approve', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const leave = await LeaveRequest_model_1.LeaveRequest.findByPk(req.params.id);
    if (!leave)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Leave request not found');
    if (leave.status !== 'Pending') {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only pending requests can be approved', 400);
    }
    const user = req.user;
    await leave.update({
        status: 'Approved',
        approverUserId: user?.id ? BigInt(user.id) : undefined,
        approvalComments: req.body.comments,
        approvalDate: new Date(),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, leave.toJSON(), 'Leave request approved');
}));
router.patch('/requests/:id/reject', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const leave = await LeaveRequest_model_1.LeaveRequest.findByPk(req.params.id);
    if (!leave)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Leave request not found');
    if (leave.status !== 'Pending') {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only pending requests can be rejected', 400);
    }
    await leave.update({
        status: 'Rejected',
        approvalComments: req.body.comments,
        approvalDate: new Date(),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, leave.toJSON(), 'Leave request rejected');
}));
router.get('/balance', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const year = new Date().getFullYear();
    const balances = await LeaveBalance_model_1.LeaveBalance.findAll({
        where: {
            staffId: user?.staffId ? BigInt(user.staffId) : BigInt(1),
            year,
        },
        include: [
            { model: LeaveType_model_1.LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color'], required: false },
        ],
    });
    const plain = balances.map(b => b.toJSON());
    ResponseFormatter_1.ResponseFormatter.success(res, {
        total: plain.reduce((sum, b) => sum + Number(b.totalDays), 0),
        used: plain.reduce((sum, b) => sum + Number(b.usedDays), 0),
        available: plain.reduce((sum, b) => sum + Number(b.remainingDays), 0),
        leaveTypes: plain,
    });
}));
router.get('/types', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const types = await LeaveType_model_1.LeaveType.findAll({ order: [['name', 'ASC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, types.map(t => t.toJSON()));
}));
exports.default = router;
//# sourceMappingURL=leave.routes.js.map