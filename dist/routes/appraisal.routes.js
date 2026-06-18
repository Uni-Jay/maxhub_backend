"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const Appraisal_model_1 = require("../models/Appraisal.model");
const Staff_model_1 = require("../models/Staff.model");
const User_model_1 = require("../models/User.model");
const Goal_model_1 = require("../models/Goal.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const isSuperAdmin_1 = require("../utils/isSuperAdmin");
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, staffId, appraisalPeriod } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (staffId)
        where.staffId = staffId;
    if (appraisalPeriod)
        where.appraisalPeriod = appraisalPeriod;
    const { count, rows } = await Appraisal_model_1.Appraisal.findAndCountAll({
        where,
        include: [{ model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'avatar', 'email'] }] }],
        order: [['appraisalDate', 'DESC']],
        limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/stats/overview', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const [total, pending, completed] = await Promise.all([
        Appraisal_model_1.Appraisal.count(),
        Appraisal_model_1.Appraisal.count({ where: { status: { [sequelize_1.Op.in]: ['Draft', 'InProgress'] } } }),
        Appraisal_model_1.Appraisal.count({ where: { status: { [sequelize_1.Op.in]: ['Completed', 'Approved'] } } }),
    ]);
    const ratings = await Appraisal_model_1.Appraisal.findAll({ attributes: ['overallRating'] });
    const avgRating = ratings.length > 0
        ? ratings.reduce((sum, a) => sum + Number(a.overallRating), 0) / ratings.length
        : 0;
    ResponseFormatter_1.ResponseFormatter.success(res, { total, pending, completed, avgRating: Number(avgRating.toFixed(2)) });
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const appraisal = await Appraisal_model_1.Appraisal.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [{ model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'avatar'] }] }],
    });
    if (!appraisal)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Appraisal not found', 404);
    const goals = await Goal_model_1.Goal.findAll({ where: { staffId: appraisal.staffId }, order: [['dueDate', 'ASC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...appraisal.toJSON(), goals });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('HR.APPRAISAL.CREATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { staffId, appraisalPeriod, appraisalDate, reviewerUserId, overallRating, performanceNotes, strengths, improvements } = req.body;
    if (!staffId || !appraisalPeriod || !appraisalDate || !reviewerUserId || overallRating === undefined) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'staffId, appraisalPeriod, appraisalDate, reviewerUserId, overallRating are required', 400);
    }
    if (overallRating < 1 || overallRating > 5) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'overallRating must be between 1 and 5', 400);
    }
    const count = await Appraisal_model_1.Appraisal.count();
    const appraisalCode = `APR-${String(count + 1).padStart(6, '0')}`;
    const appraisal = await Appraisal_model_1.Appraisal.create({
        uuid: (0, uuid_1.v4)(), appraisalCode, staffId, appraisalPeriod, appraisalDate,
        reviewerUserId, overallRating, performanceNotes, strengths, improvements,
        status: 'Draft',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, appraisal, 'Appraisal created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('HR.APPRAISAL.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const appraisal = await Appraisal_model_1.Appraisal.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!appraisal)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Appraisal not found', 404);
    if (!['Draft', 'InProgress'].includes(appraisal.status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only Draft or InProgress appraisals can be edited', 400);
    }
    const allowed = ['appraisalPeriod', 'appraisalDate', 'overallRating', 'performanceNotes', 'strengths', 'improvements'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await appraisal.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, appraisal, 'Appraisal updated');
}));
router.patch('/:id/status', AuthMiddleware_1.default.requirePermission('HR.APPRAISAL.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const appraisal = await Appraisal_model_1.Appraisal.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!appraisal)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Appraisal not found', 404);
    const { status } = req.body;
    const current = appraisal.status;
    const validTransitions = {
        Draft: ['InProgress'],
        InProgress: ['Completed'],
        Completed: ['Approved', 'Rejected'],
        Approved: [],
        Rejected: ['Draft'],
    };
    if (!validTransitions[current]?.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
    }
    if ((status === 'Approved' || status === 'Rejected') && !(0, isSuperAdmin_1.isSuperAdmin)(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only Super Admin can approve or reject an appraisal', req.path);
    }
    const updates = { status };
    if (status === 'Completed')
        updates.completedDate = new Date();
    if (status === 'Approved') {
        updates.approvedBy = req.user.id;
        updates.approvedDate = new Date();
    }
    await appraisal.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, appraisal, 'Appraisal status updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('HR.APPRAISAL.DELETE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const appraisal = await Appraisal_model_1.Appraisal.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!appraisal)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Appraisal not found', 404);
    await appraisal.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Appraisal deleted');
}));
exports.default = router;
//# sourceMappingURL=appraisal.routes.js.map