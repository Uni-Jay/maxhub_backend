"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const Meeting_model_1 = require("../models/Meeting.model");
const MeetingParticipant_model_1 = require("../models/MeetingParticipant.model");
const User_model_1 = require("../models/User.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
function makeRoomName(title, code) {
    return `MaxHub-${code}-${title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20)}`;
}
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status, type, page = 1, limit = 15 } = req.query;
    const user = req.user;
    const offset = (Number(page) - 1) * Number(limit);
    const participantMeetingIds = await MeetingParticipant_model_1.MeetingParticipant.findAll({
        where: { userId: user.id },
        attributes: ['meetingId'],
    }).then((rows) => rows.map(r => r.meetingId));
    const where = {
        [sequelize_1.Op.or]: [{ hostUserId: user.id }, { id: { [sequelize_1.Op.in]: participantMeetingIds } }],
    };
    if (status)
        where.status = status;
    if (type)
        where.meetingType = type;
    const { count, rows } = await Meeting_model_1.Meeting.findAndCountAll({
        where,
        include: [{ model: User_model_1.User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        order: [['scheduledAt', 'ASC'], ['createdAt', 'DESC']],
        limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/analytics/summary', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const total = await Meeting_model_1.Meeting.count();
    const totalByType = await Meeting_model_1.Meeting.findAll({
        attributes: ['meetingType', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
        group: ['meetingType'],
        raw: true,
    });
    const participants = await MeetingParticipant_model_1.MeetingParticipant.findAll({
        where: { joinedAt: { [sequelize_1.Op.ne]: null } },
        attributes: ['durationSeconds'],
    });
    const totalDuration = participants.reduce((s, p) => s + (p.durationSeconds || 0), 0);
    ResponseFormatter_1.ResponseFormatter.success(res, {
        totalMeetings: total,
        totalCalls: 0,
        totalMeetingDurationSeconds: totalDuration,
        totalCallDurationSeconds: 0,
        byType: Object.fromEntries(totalByType.map((r) => [r.meetingType, Number(r.count)])),
        attendanceRate: 0,
        byDepartment: [],
        topHosts: [],
    });
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const meeting = await Meeting_model_1.Meeting.findOne({
        where: { [sequelize_1.Op.or]: [(0, idOrUuid_1.idOrUuidWhere)(req.params.id), { meetingCode: req.params.id }] },
        include: [
            { model: User_model_1.User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            {
                model: MeetingParticipant_model_1.MeetingParticipant, as: 'participants',
                include: [{ model: User_model_1.User, attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
            },
        ],
    });
    if (!meeting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Meeting not found', 404);
    ResponseFormatter_1.ResponseFormatter.success(res, meeting);
}));
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { title, meetingType, scheduledAt, durationMinutes, description, participantUserIds, maxParticipants } = req.body;
    if (!title)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title is required', 400);
    const count = await Meeting_model_1.Meeting.count();
    const meetingCode = `MTG-${String(count + 1).padStart(6, '0')}`;
    const roomName = makeRoomName(title, meetingCode);
    const meeting = await Meeting_model_1.Meeting.create({
        uuid: (0, uuid_1.v4)(), meetingCode, title, description,
        meetingType: meetingType || 'Group',
        roomName, hostUserId: user.id,
        scheduledAt: scheduledAt || null,
        durationMinutes: durationMinutes || 60,
        status: 'Scheduled',
        maxParticipants: maxParticipants || null,
    });
    const allParticipants = [...new Set([user.id, ...(participantUserIds || [])])];
    await Promise.all(allParticipants.map((uid) => MeetingParticipant_model_1.MeetingParticipant.create({
        meetingId: meeting.id, userId: uid, status: uid === user.id ? 'Joined' : 'Invited',
    })));
    ResponseFormatter_1.ResponseFormatter.success(res, meeting, 'Meeting scheduled', 201);
}));
router.put('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const meeting = await Meeting_model_1.Meeting.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!meeting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Meeting not found', 404);
    const { title, description, scheduledAt, durationMinutes, maxParticipants } = req.body;
    await meeting.update({ title, description, scheduledAt, durationMinutes, maxParticipants });
    ResponseFormatter_1.ResponseFormatter.success(res, meeting, 'Meeting updated');
}));
router.patch('/:id/cancel', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const meeting = await Meeting_model_1.Meeting.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!meeting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Meeting not found', 404);
    await meeting.update({ status: 'Cancelled' });
    ResponseFormatter_1.ResponseFormatter.success(res, meeting, 'Meeting cancelled');
}));
router.post('/:id/join', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const meeting = await Meeting_model_1.Meeting.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!meeting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Meeting not found', 404);
    await meeting.update({ status: 'Live' });
    const [participant] = await MeetingParticipant_model_1.MeetingParticipant.findOrCreate({
        where: { meetingId: meeting.id, userId: user.id },
        defaults: { meetingId: meeting.id, userId: user.id, status: 'Joined', joinedAt: new Date() },
    });
    await participant.update({ joinedAt: new Date(), status: 'Joined' });
    ResponseFormatter_1.ResponseFormatter.success(res, { roomName: meeting.roomName });
}));
router.post('/:id/leave', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const meeting = await Meeting_model_1.Meeting.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!meeting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Meeting not found', 404);
    const participant = await MeetingParticipant_model_1.MeetingParticipant.findOne({
        where: { meetingId: meeting.id, userId: user.id },
    });
    if (participant) {
        const joinedAt = participant.joinedAt;
        const leftAt = new Date();
        const durationSeconds = joinedAt ? Math.floor((leftAt.getTime() - new Date(joinedAt).getTime()) / 1000) : 0;
        await participant.update({ leftAt, durationSeconds });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Left meeting');
}));
router.get('/:id/attendance', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const meeting = await Meeting_model_1.Meeting.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!meeting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Meeting not found', 404);
    const participants = await MeetingParticipant_model_1.MeetingParticipant.findAll({
        where: { meetingId: meeting.id },
        include: [{ model: User_model_1.User, attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, participants);
}));
router.post('/:id/recording', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const meeting = await Meeting_model_1.Meeting.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!meeting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Meeting not found', 404);
    const { recordingUrl, cloudinaryPublicId } = req.body;
    await meeting.update({ recordingUrl, cloudinaryPublicId, status: 'Ended' });
    ResponseFormatter_1.ResponseFormatter.success(res, { recordingUrl });
}));
exports.default = router;
//# sourceMappingURL=meeting.routes.js.map