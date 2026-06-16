"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const JobPosting_model_1 = require("@models/JobPosting.model");
const JobApplication_model_1 = require("@models/JobApplication.model");
const Department_model_1 = require("@models/Department.model");
const Designation_model_1 = require("@models/Designation.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, status, departmentId, jobType, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (departmentId)
        where.departmentId = departmentId;
    if (jobType)
        where.jobType = jobType;
    if (search)
        where.title = { [sequelize_1.Op.like]: `%${search}%` };
    const { count, rows } = await JobPosting_model_1.JobPosting.findAndCountAll({
        where,
        include: [
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name'] },
            { model: Designation_model_1.Designation, as: 'designation', attributes: ['id', 'title'] },
        ],
        order: [['postedDate', 'DESC']],
        limit: Number(limit), offset,
    });
    const rowsWithCount = await Promise.all(rows.map(async (jp) => {
        const applicationCount = await JobApplication_model_1.JobApplication.count({ where: { jobPostingId: jp.id } });
        return { ...jp.toJSON(), applicationCount };
    }));
    ResponseFormatter_1.ResponseFormatter.paginated(res, rowsWithCount, count, Number(page), Number(limit));
}));
router.get('/stats/overview', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const [total, open, closed, filled, onHold, totalApplications] = await Promise.all([
        JobPosting_model_1.JobPosting.count(),
        JobPosting_model_1.JobPosting.count({ where: { status: 'Open' } }),
        JobPosting_model_1.JobPosting.count({ where: { status: 'Closed' } }),
        JobPosting_model_1.JobPosting.count({ where: { status: 'Filled' } }),
        JobPosting_model_1.JobPosting.count({ where: { status: 'OnHold' } }),
        JobApplication_model_1.JobApplication.count(),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, open, closed, filled, onHold, totalApplications });
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const posting = await JobPosting_model_1.JobPosting.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
        include: [
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name'] },
            { model: Designation_model_1.Designation, as: 'designation', attributes: ['id', 'title'] },
        ],
    });
    if (!posting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Job posting not found', 404);
    const [applicationCount, recentApplications] = await Promise.all([
        JobApplication_model_1.JobApplication.count({ where: { jobPostingId: posting.id } }),
        JobApplication_model_1.JobApplication.findAll({ where: { jobPostingId: posting.id }, order: [['applicationDate', 'DESC']], limit: 5 }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { ...posting.toJSON(), applicationCount, recentApplications });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('rec.posting.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { title, departmentId, designationId, noOfPositions, jobType, postedDate, closingDate, description, salaryMin, salaryMax, currency, location, requiredExperience, qualifications, skills, benefits } = req.body;
    if (!title || !departmentId || !designationId || !noOfPositions || !jobType || !postedDate || !closingDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title, departmentId, designationId, noOfPositions, jobType, postedDate, closingDate are required', 400);
    }
    const count = await JobPosting_model_1.JobPosting.count();
    const jobCode = `JOB-${String(count + 1).padStart(6, '0')}`;
    const posting = await JobPosting_model_1.JobPosting.create({
        uuid: (0, uuid_1.v4)(), jobCode, title, departmentId, designationId, noOfPositions, jobType,
        postedDate, closingDate, description, salaryMin, salaryMax, currency: currency || 'NGN',
        location, requiredExperience, qualifications, skills, benefits,
        status: 'Draft', createdById: req.user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, posting, 'Job posting created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('rec.posting.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const posting = await JobPosting_model_1.JobPosting.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!posting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Job posting not found', 404);
    const allowed = ['title', 'description', 'noOfPositions', 'jobType', 'salaryMin', 'salaryMax', 'location',
        'requiredExperience', 'qualifications', 'skills', 'benefits', 'closingDate'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await posting.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, posting, 'Job posting updated');
}));
router.patch('/:id/status', AuthMiddleware_1.default.requirePermission('rec.posting.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const posting = await JobPosting_model_1.JobPosting.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!posting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Job posting not found', 404);
    const { status } = req.body;
    const validTransitions = {
        Draft: ['Open', 'Cancelled'],
        Open: ['Closed', 'OnHold', 'Filled'],
        OnHold: ['Open', 'Closed'],
        Closed: ['Open'],
        Filled: [],
        Cancelled: [],
    };
    const current = posting.status;
    if (!validTransitions[current]?.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
    }
    await posting.update({ status });
    ResponseFormatter_1.ResponseFormatter.success(res, posting, 'Status updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('rec.posting.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const posting = await JobPosting_model_1.JobPosting.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!posting)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Job posting not found', 404);
    if (posting.status !== 'Draft')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only Draft postings can be deleted', 400);
    await posting.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Job posting deleted');
}));
exports.default = router;
//# sourceMappingURL=job-posting.routes.js.map