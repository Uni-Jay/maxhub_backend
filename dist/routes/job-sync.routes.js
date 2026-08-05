"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("@utils/idOrUuid");
const JobPosting_model_1 = require("@models/JobPosting.model");
const JobSyncLog_model_1 = require("@models/JobSyncLog.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const JobSyncService_1 = __importDefault(require("@services/JobSyncService"));
const router = (0, express_1.Router)();
router.get('/stats', AuthMiddleware_1.default.requirePermission('rec.posting.read.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const [total, synced, pending, failed] = await Promise.all([
        JobPosting_model_1.JobPosting.count({ where: { businessUnit: { [sequelize_1.Op.ne]: null } } }),
        JobPosting_model_1.JobPosting.count({ where: { syncStatus: 'Synced' } }),
        JobPosting_model_1.JobPosting.count({ where: { syncStatus: 'Pending', businessUnit: { [sequelize_1.Op.ne]: null } } }),
        JobPosting_model_1.JobPosting.count({ where: { syncStatus: 'Failed' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, synced, pending, failed });
}));
router.get('/', AuthMiddleware_1.default.requirePermission('rec.posting.read.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, syncStatus, businessUnit } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = { businessUnit: { [sequelize_1.Op.ne]: null } };
    if (syncStatus)
        where.syncStatus = syncStatus;
    if (businessUnit)
        where.businessUnit = businessUnit;
    const { count, rows } = await JobPosting_model_1.JobPosting.findAndCountAll({
        where,
        attributes: ['id', 'uuid', 'jobCode', 'title', 'status', 'businessUnit', 'syncStatus', 'externalJobId',
            'syncAttempts', 'lastSyncedAt', 'lastSyncError', 'createdAt'],
        order: [['updatedAt', 'DESC']],
        limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.patch('/:id/retry', AuthMiddleware_1.default.requirePermission('rec.posting.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const posting = await JobPosting_model_1.JobPosting.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!posting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Job posting not found', 404);
    if (!posting.businessUnit)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'This posting has no business unit assigned', 400);
    await JobSyncService_1.default.retryOne(posting.id);
    await posting.reload();
    ResponseFormatter_1.ResponseFormatter.success(res, posting, 'Retry attempted');
}));
router.get('/:id/logs', AuthMiddleware_1.default.requirePermission('rec.posting.read.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const posting = await JobPosting_model_1.JobPosting.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!posting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Job posting not found', 404);
    const logs = await JobSyncLog_model_1.JobSyncLog.findAll({
        where: { jobPostingId: posting.id },
        order: [['createdAt', 'DESC']],
        limit: 50,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, logs);
}));
exports.default = router;
//# sourceMappingURL=job-sync.routes.js.map