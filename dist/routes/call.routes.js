"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Call_model_1 = require("@models/Call.model");
const User_model_1 = require("@models/User.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const caller = req.user;
    const { calleeUserId, callType, conversationId } = req.body;
    if (!calleeUserId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'calleeUserId is required', 400);
    await Call_model_1.Call.update({ status: 'Missed' }, { where: { callerUserId: caller.id, status: 'Ringing' } });
    const roomName = `MaxHub-call-${(0, uuid_1.v4)().split('-')[0]}`;
    const call = await Call_model_1.Call.create({
        uuid: (0, uuid_1.v4)(),
        callerUserId: caller.id,
        calleeUserId,
        callType: callType || 'Video',
        status: 'Ringing',
        roomName,
        conversationId: conversationId || null,
    });
    const callWithUsers = await Call_model_1.Call.findByPk(call.id, {
        include: [
            { model: User_model_1.User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            { model: User_model_1.User, as: 'callee', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        ],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, callWithUsers, 'Call initiated', 201);
}));
router.get('/incoming', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const calls = await Call_model_1.Call.findAll({
        where: { calleeUserId: user.id, status: 'Ringing' },
        include: [{ model: User_model_1.User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, calls);
}));
router.get('/history', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await Call_model_1.Call.findAndCountAll({
        where: {
            [sequelize_1.Op.or]: [{ callerUserId: user.id }, { calleeUserId: user.id }],
        },
        include: [
            { model: User_model_1.User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            { model: User_model_1.User, as: 'callee', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.patch('/:id/answer', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const call = await Call_model_1.Call.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!call)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Call not found', 404);
    await call.update({ status: 'Active', startedAt: new Date() });
    ResponseFormatter_1.ResponseFormatter.success(res, call, 'Call answered');
}));
router.patch('/:id/decline', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const call = await Call_model_1.Call.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!call)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Call not found', 404);
    await call.update({ status: 'Declined', endedAt: new Date() });
    ResponseFormatter_1.ResponseFormatter.success(res, call, 'Call declined');
}));
router.patch('/:id/end', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const call = await Call_model_1.Call.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!call)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Call not found', 404);
    const endedAt = new Date();
    const startedAt = call.startedAt;
    const durationSeconds = startedAt
        ? Math.floor((endedAt.getTime() - new Date(startedAt).getTime()) / 1000)
        : 0;
    await call.update({ status: 'Ended', endedAt, durationSeconds });
    ResponseFormatter_1.ResponseFormatter.success(res, call, 'Call ended');
}));
exports.default = router;
//# sourceMappingURL=call.routes.js.map