"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const Task_model_1 = require("@models/Task.model");
const Project_model_1 = require("@models/Project.model");
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
    if (req.query.projectId)
        where.projectId = BigInt(req.query.projectId);
    if (req.query.assigneeId)
        where.assigneeId = BigInt(req.query.assigneeId);
    if (req.query.search) {
        where[sequelize_1.Op.or] = [
            { title: { [sequelize_1.Op.like]: `%${req.query.search}%` } },
            { taskCode: { [sequelize_1.Op.like]: `%${req.query.search}%` } },
        ];
    }
    const { count, rows } = await Task_model_1.Task.findAndCountAll({
        where,
        include: [
            { model: Project_model_1.Project, attributes: ['id', 'name'], required: false },
            {
                model: Staff_model_1.Staff,
                as: 'assignee',
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
    const task = await Task_model_1.Task.findByPk(req.params.id, {
        include: [
            { model: Project_model_1.Project, attributes: ['id', 'name', 'projectCode'] },
            { model: Staff_model_1.Staff, as: 'assignee', attributes: ['id', 'firstName', 'lastName'], required: false },
        ],
    });
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON());
}));
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { title, description, taskCode, projectId, assigneeId, priority, status, startDate, dueDate, estimatedHours, label, } = req.body;
    const user = req.user;
    const task = await Task_model_1.Task.create({
        title,
        description,
        taskCode: taskCode || `TSK${Date.now()}`,
        projectId: BigInt(projectId),
        assigneeId: assigneeId ? BigInt(assigneeId) : undefined,
        reporterId: BigInt(user?.id || 1),
        priority: priority || 'Medium',
        status: status || 'Todo',
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours,
        label,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON(), 'Task created successfully', 201);
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    const { title, description, status, priority, dueDate, progress, actualHours, label, } = req.body;
    await task.update({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(progress !== undefined && { progress }),
        ...(actualHours !== undefined && { actualHours }),
        ...(label !== undefined && { label }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON(), 'Task updated successfully');
}));
router.patch('/:id/status', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    await task.update({ status: req.body.status });
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON(), 'Task status updated');
}));
router.patch('/:id/assign', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    await task.update({ assigneeId: BigInt(req.body.assigneeId) });
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON(), 'Task assigned successfully');
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    await task.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Task deleted successfully');
}));
exports.default = router;
//# sourceMappingURL=task.routes.js.map