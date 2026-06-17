"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const TrainingProgram_model_1 = require("../models/TrainingProgram.model");
const TrainingAttendance_model_1 = require("../models/TrainingAttendance.model");
const Staff_model_1 = require("../models/Staff.model");
const User_model_1 = require("../models/User.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, status, trainingType, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (trainingType)
        where.trainingType = trainingType;
    if (search)
        where.trainingName = { [sequelize_1.Op.iLike]: `%${search}%` };
    const { count, rows } = await TrainingProgram_model_1.TrainingProgram.findAndCountAll({
        where, order: [['startDate', 'DESC']], limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/stats/overview', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const [total, active, completed] = await Promise.all([
        TrainingProgram_model_1.TrainingProgram.count(),
        TrainingProgram_model_1.TrainingProgram.count({ where: { status: 'Active' } }),
        TrainingProgram_model_1.TrainingProgram.count({ where: { status: 'Completed' } }),
    ]);
    const budgetResult = await TrainingProgram_model_1.TrainingProgram.findAll({ attributes: ['budget'] });
    const totalBudget = budgetResult.reduce((sum, t) => sum + Number(t.budget || 0), 0);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, active, completed, totalBudget });
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const program = await TrainingProgram_model_1.TrainingProgram.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!program)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Training program not found', 404);
    const [presentCount, absentCount, lateCount] = await Promise.all([
        TrainingAttendance_model_1.TrainingAttendance.count({ where: { trainingProgramId: program.id, status: 'Present' } }),
        TrainingAttendance_model_1.TrainingAttendance.count({ where: { trainingProgramId: program.id, status: 'Absent' } }),
        TrainingAttendance_model_1.TrainingAttendance.count({ where: { trainingProgramId: program.id, status: 'Late' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { ...program.toJSON(), attendanceSummary: { present: presentCount, absent: absentCount, late: lateCount } });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('HR.TRAINING.CREATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { trainingName, trainingType, duration, durationUnit, startDate, endDate, description, provider, location, budget } = req.body;
    if (!trainingName || !trainingType || !duration || !durationUnit || !startDate || !endDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'trainingName, trainingType, duration, durationUnit, startDate, endDate are required', 400);
    }
    const count = await TrainingProgram_model_1.TrainingProgram.count();
    const trainingCode = `TRN-${String(count + 1).padStart(6, '0')}`;
    const program = await TrainingProgram_model_1.TrainingProgram.create({
        uuid: (0, uuid_1.v4)(), trainingCode, trainingName, trainingType, duration, durationUnit,
        startDate, endDate, description, provider, location, budget,
        status: 'Draft', createdById: req.user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, program, 'Training program created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('HR.TRAINING.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const program = await TrainingProgram_model_1.TrainingProgram.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!program)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Training program not found', 404);
    const allowed = ['trainingName', 'description', 'trainingType', 'duration', 'durationUnit', 'provider', 'location', 'startDate', 'endDate', 'budget'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await program.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, program, 'Training program updated');
}));
router.patch('/:id/status', AuthMiddleware_1.default.requirePermission('HR.TRAINING.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const program = await TrainingProgram_model_1.TrainingProgram.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!program)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Training program not found', 404);
    const { status } = req.body;
    const current = program.status;
    const validTransitions = {
        Draft: ['Active', 'Cancelled'],
        Active: ['Completed', 'Cancelled'],
        Completed: [],
        Cancelled: [],
    };
    if (!validTransitions[current]?.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
    }
    await program.update({ status });
    ResponseFormatter_1.ResponseFormatter.success(res, program, 'Status updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('HR.TRAINING.DELETE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const program = await TrainingProgram_model_1.TrainingProgram.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!program)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Training program not found', 404);
    await program.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Training program deleted');
}));
router.get('/:id/attendance', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const program = await TrainingProgram_model_1.TrainingProgram.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!program)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Training program not found', 404);
    const attendance = await TrainingAttendance_model_1.TrainingAttendance.findAll({
        where: { trainingProgramId: program.id },
        include: [{ model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName'] }] }],
        order: [['attendanceDate', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, attendance);
}));
router.post('/:id/attendance', AuthMiddleware_1.default.requirePermission('HR.TRAINING.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const program = await TrainingProgram_model_1.TrainingProgram.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!program)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Training program not found', 404);
    const { staffId, attendanceDate, status, notes } = req.body;
    if (!staffId || !attendanceDate || !status) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'staffId, attendanceDate, status are required', 400);
    }
    const [record, created] = await TrainingAttendance_model_1.TrainingAttendance.findOrCreate({
        where: { trainingProgramId: program.id, staffId, attendanceDate },
        defaults: { trainingProgramId: program.id, staffId, attendanceDate, status, notes },
    });
    if (!created)
        await record.update({ status, notes });
    ResponseFormatter_1.ResponseFormatter.success(res, record, created ? 'Attendance recorded' : 'Attendance updated', created ? 201 : 200);
}));
router.put('/:id/attendance/:attendanceId', AuthMiddleware_1.default.requirePermission('HR.TRAINING.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const record = await TrainingAttendance_model_1.TrainingAttendance.findByPk(req.params.attendanceId);
    if (!record)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Attendance record not found', 404);
    const { status, notes } = req.body;
    await record.update({ status, notes });
    ResponseFormatter_1.ResponseFormatter.success(res, record, 'Attendance updated');
}));
exports.default = router;
//# sourceMappingURL=training.routes.js.map