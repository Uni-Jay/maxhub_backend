"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const JobApplication_model_1 = require("@models/JobApplication.model");
const JobPosting_model_1 = require("@models/JobPosting.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, jobPostingId, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (jobPostingId)
        where.jobPostingId = jobPostingId;
    if (search)
        where[sequelize_1.Op.or] = [
            { applicantName: { [sequelize_1.Op.like]: `%${search}%` } },
            { applicantEmail: { [sequelize_1.Op.like]: `%${search}%` } },
        ];
    const { count, rows } = await JobApplication_model_1.JobApplication.findAndCountAll({
        where,
        include: [{ model: JobPosting_model_1.JobPosting, as: 'jobPosting', attributes: ['id', 'title', 'jobCode', 'status'] }],
        order: [['applicationDate', 'DESC']],
        limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const application = await JobApplication_model_1.JobApplication.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
        include: [{ model: JobPosting_model_1.JobPosting, as: 'jobPosting' }],
    });
    if (!application)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Application not found', 404);
    ResponseFormatter_1.ResponseFormatter.success(res, application);
}));
router.post('/', AuthMiddleware_1.default.requirePermission('rec.application.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { jobPostingId, applicantName, applicantEmail, applicantPhone, resumeUrl, coverLetterUrl, source, notes, contactId } = req.body;
    if (!jobPostingId || !applicantName || !applicantEmail || !applicantPhone) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'jobPostingId, applicantName, applicantEmail, applicantPhone are required', 400);
    }
    const posting = await JobPosting_model_1.JobPosting.findByPk(jobPostingId);
    if (!posting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Job posting not found', 404);
    if (posting.status !== 'Open')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Job posting is not open for applications', 400);
    const existing = await JobApplication_model_1.JobApplication.findOne({ where: { jobPostingId, applicantEmail } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Applicant has already applied for this position', 409);
    const application = await JobApplication_model_1.JobApplication.create({
        uuid: (0, uuid_1.v4)(), jobPostingId, contactId,
        applicantName, applicantEmail, applicantPhone,
        resumeUrl, coverLetterUrl, source, notes,
        applicationDate: new Date(), status: 'Applied',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, application, 'Application submitted', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('rec.application.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const application = await JobApplication_model_1.JobApplication.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!application)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Application not found', 404);
    const allowed = ['applicantName', 'applicantPhone', 'resumeUrl', 'coverLetterUrl', 'source', 'notes'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await application.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, application, 'Application updated');
}));
router.patch('/:id/status', AuthMiddleware_1.default.requirePermission('rec.application.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const application = await JobApplication_model_1.JobApplication.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!application)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Application not found', 404);
    const { status, notes } = req.body;
    const current = application.status;
    const validTransitions = {
        Applied: ['Shortlisted', 'Rejected'],
        Shortlisted: ['Interviewed', 'Rejected'],
        Interviewed: ['Offered', 'Rejected'],
        Offered: ['Withdrawn'],
        Rejected: [],
        Withdrawn: [],
    };
    if (!validTransitions[current]?.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
    }
    await application.update({ status, notes: notes || application.notes });
    ResponseFormatter_1.ResponseFormatter.success(res, application, 'Status updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('rec.application.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const application = await JobApplication_model_1.JobApplication.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!application)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Application not found', 404);
    await application.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Application deleted');
}));
exports.default = router;
//# sourceMappingURL=job-application.routes.js.map