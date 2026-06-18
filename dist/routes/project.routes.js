"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const PermissionCodes_1 = require("../config/PermissionCodes");
const Project_model_1 = require("../models/Project.model");
const Task_model_1 = require("../models/Task.model");
const Milestone_model_1 = require("../models/Milestone.model");
const Department_model_1 = require("../models/Department.model");
const Staff_model_1 = require("../models/Staff.model");
const ProjectComment_model_1 = require("../models/ProjectComment.model");
const Notification_model_1 = require("../models/Notification.model");
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
function canAccessProject(project, staffId) {
    if (!staffId)
        return false;
    return String(project.projectManagerId) === String(staffId);
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
    if (req.query.departmentId)
        where.departmentId = BigInt(req.query.departmentId);
    const andConditions = [];
    if (req.query.search) {
        andConditions.push({
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.iLike]: `%${req.query.search}%` } },
                { projectCode: { [sequelize_1.Op.iLike]: `%${req.query.search}%` } },
            ],
        });
    }
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        andConditions.push({ projectManagerId: staffId ?? -1 });
    }
    if (andConditions.length)
        where[sequelize_1.Op.and] = andConditions;
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
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessProject(project, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    }
    ResponseFormatter_1.ResponseFormatter.success(res, project.toJSON());
}));
router.post('/', AuthMiddleware_1.AuthMiddleware.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_CREATE_ALL, PermissionCodes_1.PermissionCode.PROJECT_CREATE_OWN_DEPARTMENT, PermissionCodes_1.PermissionCode.PROJECT_CREATE_OWN), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const canCreateAll = hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_CREATE_ALL);
    const canCreateOwnDepartment = !canCreateAll && hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_CREATE_OWN_DEPARTMENT);
    const user = req.user;
    const ownStaffId = await getOwnStaffId(req);
    const { name, description, projectCode, endDate, expectedEndDate, budget, status, priority, } = req.body;
    let departmentId;
    let projectManagerId;
    let startDate;
    if (canCreateAll) {
        if (!req.body.departmentId || !req.body.projectManagerId) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'departmentId and projectManagerId are required', 400);
        }
        departmentId = BigInt(req.body.departmentId);
        projectManagerId = BigInt(req.body.projectManagerId);
        startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    }
    else if (canCreateOwnDepartment) {
        if (!user?.departmentId) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'No department linked to this account', 400);
        }
        if (!req.body.projectManagerId) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'projectManagerId is required', 400);
        }
        const manager = await Staff_model_1.Staff.findByPk(req.body.projectManagerId, { attributes: ['id', 'departmentId'] });
        if (!manager || String(manager.departmentId) !== String(user.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You can only assign a project manager from your own department', req.path);
        }
        departmentId = BigInt(user.departmentId);
        projectManagerId = BigInt(req.body.projectManagerId);
        startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    }
    else {
        if (!ownStaffId || !user?.departmentId) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'No staff profile/department linked to this account', 400);
        }
        departmentId = BigInt(user.departmentId);
        projectManagerId = ownStaffId;
        startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    }
    const project = await Project_model_1.Project.create({
        name,
        description,
        projectCode: projectCode || `PRJ${Date.now()}`,
        departmentId,
        projectManagerId,
        startDate,
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
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_UPDATE_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessProject(project, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    }
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
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const project = await Project_model_1.Project.findByPk(req.params.id);
    if (!project)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_DELETE_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessProject(project, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    }
    await project.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Project deleted successfully');
}));
router.get('/:id/tasks', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const project = await Project_model_1.Project.findByPk(req.params.id);
    if (!project)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessProject(project, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    }
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
router.post('/:id/comments', AuthMiddleware_1.AuthMiddleware.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_COMMENT_CREATE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const project = await Project_model_1.Project.findByPk(req.params.id);
    if (!project)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessProject(project, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    }
    const { content } = req.body;
    if (!content)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'content is required', 400);
    const ownStaffId = await getOwnStaffId(req);
    if (!ownStaffId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'No staff profile linked to this account', 400);
    const comment = await ProjectComment_model_1.ProjectComment.create({
        projectId: project.id,
        staffId: ownStaffId,
        content,
    });
    if (project.projectManagerId && String(project.projectManagerId) !== String(ownStaffId)) {
        const manager = await Staff_model_1.Staff.findByPk(project.projectManagerId, { attributes: ['userId'] });
        const managerUserId = manager?.userId;
        if (managerUserId) {
            await Notification_model_1.Notification.create({
                recipientUserId: managerUserId,
                notificationType: 'Assignment',
                title: 'New project report',
                message: `A report was submitted on project "${project.name}"`,
                relatedEntityType: 'Project',
                relatedEntityId: project.id,
                actionUrl: `/projects/${project.id}`,
                deliveryChannel: 'InApp',
                priority: 'Medium',
            });
        }
    }
    ResponseFormatter_1.ResponseFormatter.success(res, comment.toJSON(), 'Report submitted', 201);
}));
router.get('/:id/comments', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const project = await Project_model_1.Project.findByPk(req.params.id);
    if (!project)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    if (!hasPermission(req, PermissionCodes_1.PermissionCode.PROJECT_READ_ALL)) {
        const staffId = await getOwnStaffId(req);
        if (!canAccessProject(project, staffId))
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Project not found');
    }
    const comments = await ProjectComment_model_1.ProjectComment.findAll({
        where: { projectId: project.id },
        include: [{ model: Staff_model_1.Staff, as: 'author', attributes: ['id', 'firstName', 'lastName'] }],
        order: [['createdAt', 'ASC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, comments.map(c => c.toJSON()));
}));
exports.default = router;
//# sourceMappingURL=project.routes.js.map