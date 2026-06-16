"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const Project_model_1 = require("@models/Project.model");
const Task_model_1 = require("@models/Task.model");
const Milestone_model_1 = require("@models/Milestone.model");
const Department_model_1 = require("@models/Department.model");
const Staff_model_1 = require("@models/Staff.model");
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.status)
        where.status = req.query.status;
    if (req.query.priority)
        where.priority = req.query.priority;
    if (req.query.departmentId)
        where.departmentId = BigInt(req.query.departmentId);
    if (req.query.search) {
        where[sequelize_1.Op.or] = [
            { name: { [sequelize_1.Op.like]: `%${req.query.search}%` } },
            { projectCode: { [sequelize_1.Op.like]: `%${req.query.search}%` } },
        ];
    }
    const { count, rows } = await Project_model_1.Project.findAndCountAll({
        where,
        include: [
            { model: Department_model_1.Department, attributes: ['id', 'name'], required: false },
            {
                model: Staff_model_1.Staff,
                as: 'projectManager',
                attributes: ['id', 'firstName', 'lastName'],
                required: false,
            },
        ],
        limit,
        offset,
        order: [[req.sort?.field || 'createdAt', req.sort?.order || 'DESC']],
        paranoid: true,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const project = await Project_model_1.Project.findByPk(req.params.id, {
        include: [
            { model: Department_model_1.Department, attributes: ['id', 'name'] },
            { model: Staff_model_1.Staff, as: 'projectManager', attributes: ['id', 'firstName', 'lastName'] },
        ],
    });
    if (!project)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    ResponseFormatter_1.ResponseFormatter.success(res, project.toJSON());
}));
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name, description, projectCode, departmentId, projectManagerId, startDate, endDate, expectedEndDate, budget, status, priority, } = req.body;
    const project = await Project_model_1.Project.create({
        name,
        description,
        projectCode: projectCode || `PRJ${Date.now()}`,
        departmentId: BigInt(departmentId),
        projectManagerId: BigInt(projectManagerId),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
        budget,
        status: status || 'Planning',
        priority: priority || 'Medium',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, project.toJSON(), 'Project created successfully', 201);
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const project = await Project_model_1.Project.findByPk(req.params.id);
    if (!project)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    const { name, description, status, priority, endDate, expectedEndDate, progress, budget, } = req.body;
    await project.update({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(progress !== undefined && { progress }),
        ...(budget !== undefined && { budget }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(expectedEndDate !== undefined && { expectedEndDate: new Date(expectedEndDate) }),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, project.toJSON(), 'Project updated successfully');
}));
router.get('/:id/tasks', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const project = await Project_model_1.Project.findByPk(req.params.id);
    if (!project)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    const tasks = await Task_model_1.Task.findAll({
        where: { projectId: project.id },
        include: [
            { model: Staff_model_1.Staff, as: 'assignee', attributes: ['id', 'firstName', 'lastName'], required: false },
        ],
        order: [['createdAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, tasks.map(t => t.toJSON()));
}));
router.get('/:id/milestones', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const project = await Project_model_1.Project.findByPk(req.params.id);
    if (!project)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    const milestones = await Milestone_model_1.Milestone.findAll({
        where: { projectId: project.id },
        order: [['dueDate', 'ASC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, milestones.map(m => m.toJSON()));
}));
router.get('/:id/team', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.default = router;
//# sourceMappingURL=project.routes.js.map