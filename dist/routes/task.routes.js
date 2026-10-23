"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingTasksSummary = getPendingTasksSummary;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const PermissionCodes_1 = require("../config/PermissionCodes");
const RoleBucket_1 = require("../utils/RoleBucket");
const Task_model_1 = require("../models/Task.model");
const Project_model_1 = require("../models/Project.model");
const Staff_model_1 = require("../models/Staff.model");
const ProjectComment_model_1 = require("../models/ProjectComment.model");
const Notification_model_1 = require("../models/Notification.model");
const notify_1 = require("../utils/notify");
const router = (0, express_1.Router)();
function isBypassRole(req) {
    const roles = (req.user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    return roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin');
}
function hasPermission(req, code) {
    if (isBypassRole(req))
        return true;
    const perms = new Set((req.user?.permissions || []).map((p) => String(p).toLowerCase()));
    return perms.has(code.toLowerCase());
}
async function getOwnStaffId(req) {
    const userId = req.user?.id;
    if (!userId)
        return null;
    const staff = await Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id'] });
    return staff ? staff.id : null;
}
function canAccessTask(task, staffId) {
    if (!staffId)
        return false;
    return String(task.assigneeId) === String(staffId) || String(task.reporterId) === String(staffId);
}
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
    const andConditions = [];
    if (req.query.search) {
        andConditions.push({
            [sequelize_1.Op.or]: [
                { title: { [sequelize_1.Op.iLike]: `%${req.query.search}%` } },
                { taskCode: { [sequelize_1.Op.iLike]: `%${req.query.search}%` } },
            ],
        });
    }
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.TASK_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        andConditions.push({
            [sequelize_1.Op.or]: [{ assigneeId: staffId ?? -1 }, { reporterId: staffId ?? -1 }],
        });
    }
    if (andConditions.length)
        where[sequelize_1.Op.and] = andConditions;
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
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.TASK_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessTask(task, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    }
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON());
}));
router.post('/', AuthMiddleware_1.AuthMiddleware.requirePermission(PermissionCodes_1.PermissionCode.TASK_CREATE_ALL, PermissionCodes_1.PermissionCode.TASK_CREATE_OWN), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const canCreateAll = hasPermission(req, PermissionCodes_1.PermissionCode.TASK_CREATE_ALL);
    const user = req.user;
    const ownStaffId = await getOwnStaffId(req);
    const reporterId = ownStaffId ?? BigInt(user?.id || 1);
    const { title, description, taskCode, priority, status, startDate, dueDate, estimatedHours, label, } = req.body;
    let projectId;
    let assigneeId;
    if (canCreateAll) {
        if (!req.body.projectId)
            return ResponseFormatter_1.ResponseFormatter.error(res, 'projectId is required', 400);
        projectId = BigInt(req.body.projectId);
        assigneeId = req.body.assigneeId ? BigInt(req.body.assigneeId) : undefined;
    }
    else {
        projectId = undefined;
        assigneeId = ownStaffId ?? undefined;
    }
    const task = await Task_model_1.Task.create({
        title,
        description,
        taskCode: taskCode || `TSK${Date.now()}`,
        projectId,
        assigneeId,
        reporterId,
        priority: priority || 'Medium',
        status: status || 'Todo',
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours,
        label,
    });
    if (assigneeId && String(assigneeId) !== String(reporterId)) {
        const io = req.app?.get('io');
        (0, notify_1.notifyStaff)(assigneeId, {
            type: 'Assignment',
            title: 'New task assigned to you',
            message: `You've been assigned "${task.title}".`,
            relatedEntityType: 'Task',
            relatedEntityId: task.id,
            actionUrl: `/tasks/${task.id}`,
            priority: priority === 'Critical' || priority === 'High' ? 'High' : 'Medium',
        }, io).catch(() => { });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON(), 'Task created successfully', 201);
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.TASK_UPDATE_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessTask(task, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    }
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
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.TASK_UPDATE_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessTask(task, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    }
    await task.update({ status: req.body.status });
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON(), 'Task status updated');
}));
router.patch('/:id/assign', AuthMiddleware_1.AuthMiddleware.requirePermission(PermissionCodes_1.PermissionCode.TASK_UPDATE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    const newAssigneeId = BigInt(req.body.assigneeId);
    const previousAssigneeId = task.assigneeId;
    await task.update({ assigneeId: newAssigneeId });
    if (String(newAssigneeId) !== String(previousAssigneeId)) {
        const io = req.app?.get('io');
        (0, notify_1.notifyStaff)(newAssigneeId, {
            type: 'Assignment',
            title: 'Task assigned to you',
            message: `You've been assigned "${task.title}".`,
            relatedEntityType: 'Task',
            relatedEntityId: task.id,
            actionUrl: `/tasks/${task.id}`,
            priority: 'Medium',
        }, io).catch(() => { });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, task.toJSON(), 'Task assigned successfully');
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.TASK_DELETE_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessTask(task, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    }
    await task.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Task deleted successfully');
}));
router.post('/:id/comments', AuthMiddleware_1.AuthMiddleware.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_COMMENT_CREATE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.TASK_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessTask(task, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    }
    const { content } = req.body;
    if (!content)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'content is required', 400);
    const ownStaffId = await getOwnStaffId(req);
    if (!ownStaffId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'No staff profile linked to this account', 400);
    const comment = await ProjectComment_model_1.ProjectComment.create({
        taskId: task.id,
        projectId: task.projectId,
        staffId: ownStaffId,
        content,
    });
    if (task.reporterId && String(task.reporterId) !== String(ownStaffId)) {
        const assigner = await Staff_model_1.Staff.findByPk(task.reporterId, { attributes: ['userId'] });
        const assignerUserId = assigner?.userId;
        if (assignerUserId) {
            await Notification_model_1.Notification.create({
                recipientUserId: assignerUserId,
                notificationType: 'Assignment',
                title: 'New task report',
                message: `A report was submitted on task "${task.title}"`,
                relatedEntityType: 'Task',
                relatedEntityId: task.id,
                actionUrl: `/tasks/${task.id}`,
                deliveryChannel: 'InApp',
                priority: 'Medium',
            });
        }
    }
    ResponseFormatter_1.ResponseFormatter.success(res, comment.toJSON(), 'Report submitted', 201);
}));
router.get('/:id/comments', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const task = await Task_model_1.Task.findByPk(req.params.id);
    if (!task)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.TASK_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessTask(task, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Task not found');
    }
    const comments = await ProjectComment_model_1.ProjectComment.findAll({
        where: { taskId: task.id },
        include: [{ model: Staff_model_1.Staff, as: 'author', attributes: ['id', 'firstName', 'lastName'] }],
        order: [['createdAt', 'ASC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, comments.map(c => c.toJSON()));
}));
async function getPendingTasksSummary(req) {
    const bucket = (0, RoleBucket_1.getRoleBucket)(req);
    const where = { status: { [sequelize_1.Op.notIn]: ['Done', 'Cancelled'] } };
    if (bucket === 'staff') {
        const staffId = await getOwnStaffId(req);
        where[sequelize_1.Op.or] = [{ assigneeId: staffId ?? -1 }, { reporterId: staffId ?? -1 }];
    }
    else if (bucket === 'hod') {
        const departmentId = req.user?.departmentId;
        const deptStaff = await Staff_model_1.Staff.findAll({ where: { departmentId: departmentId ?? -1 }, attributes: ['id'] });
        const staffIds = deptStaff.map((s) => s.id);
        where.assigneeId = { [sequelize_1.Op.in]: staffIds.length ? staffIds : [-1] };
    }
    const tasks = await Task_model_1.Task.findAll({
        where,
        include: [
            { model: Project_model_1.Project, attributes: ['id', 'name'], required: false },
            { model: Staff_model_1.Staff, as: 'assignee', attributes: ['id', 'firstName', 'lastName'], required: false },
        ],
        order: [['dueDate', 'ASC']],
        limit: 25,
    });
    const todayStr = new Date().toDateString();
    return {
        scope: bucket,
        total: tasks.length,
        tasks: tasks.map((t) => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            dueToday: t.dueDate ? new Date(t.dueDate).toDateString() === todayStr : false,
            overdue: !!t.dueDate && new Date(t.dueDate) < new Date(todayStr) && t.status !== 'Done',
            project: t.project?.name ?? (t.projectId ? undefined : 'Personal task'),
            assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : undefined,
        })),
    };
}
exports.default = router;
//# sourceMappingURL=task.routes.js.map