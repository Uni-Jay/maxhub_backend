"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const RBACMiddleware_1 = require("../middleware/RBACMiddleware");
const PermissionCodes_1 = require("../config/PermissionCodes");
const ProjectService_1 = require("../services/ProjectService");
const router = (0, express_1.Router)();
const projectService = new ProjectService_1.ProjectService();
const auth = new AuthMiddleware_1.AuthMiddleware();
const rbac = new RBACMiddleware_1.RBACMiddleware();
router.post('/:projectId/comments', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_COMMENT_CREATE_ALL), async (req, res) => {
    try {
        const projectId = BigInt(req.params.projectId);
        const commentData = {
            ...req.body,
            projectId,
        };
        const result = await projectService.addComment(req, commentData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/:projectId/comments/:commentId', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_COMMENT_CREATE_ALL), async (req, res) => {
    try {
        const commentId = BigInt(req.params.commentId);
        const result = await projectService.updateComment(req, commentId, req.body.content);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.delete('/:projectId/comments/:commentId', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_COMMENT_DELETE_ALL), async (req, res) => {
    try {
        const commentId = BigInt(req.params.commentId);
        const result = await projectService.deleteComment(req, commentId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/:projectId/comments/:commentId/resolve', auth.authenticate(), async (req, res) => {
    try {
        const commentId = BigInt(req.params.commentId);
        const result = await projectService.resolveComment(req, commentId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/:projectId/attachments', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_ATTACHMENT_CREATE_ALL), async (req, res) => {
    try {
        const projectId = BigInt(req.params.projectId);
        const attachmentData = {
            ...req.body,
            projectId,
        };
        const result = await projectService.uploadAttachment(req, attachmentData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.get('/:projectId/attachments/:attachmentId', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_ATTACHMENT_READ_ALL), async (req, res) => {
    try {
        const attachmentId = BigInt(req.params.attachmentId);
        const result = await projectService.downloadAttachment(req, attachmentId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/:projectId/tasks/assign', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.TASK_UPDATE_ALL), async (req, res) => {
    try {
        const projectId = BigInt(req.params.projectId);
        const assignmentData = {
            ...req.body,
            projectId,
        };
        const result = await projectService.assignTask(req, assignmentData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/:projectId/tasks/assignments/:assignmentId/accept', auth.authenticate(), async (req, res) => {
    try {
        const assignmentId = BigInt(req.params.assignmentId);
        const staffId = req.user.staffId;
        const result = await projectService.acceptTaskAssignment(req, assignmentId, staffId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/:projectId/tasks/assignments/:assignmentId/decline', auth.authenticate(), async (req, res) => {
    try {
        const assignmentId = BigInt(req.params.assignmentId);
        const staffId = req.user.staffId;
        const reason = req.body.reason || '';
        const result = await projectService.declineTaskAssignment(req, assignmentId, staffId, reason);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/:projectId/kanban', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_KANBAN_UPDATE_ALL), async (req, res) => {
    try {
        const projectId = BigInt(req.params.projectId);
        const boardData = {
            ...req.body,
            projectId,
        };
        const result = await projectService.createKanbanBoard(req, boardData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/:projectId/kanban/:boardId', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_KANBAN_UPDATE_ALL), async (req, res) => {
    try {
        const boardId = BigInt(req.params.boardId);
        const result = await projectService.updateKanbanBoard(req, boardId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/:projectId/kanban/:boardId/move-task', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_KANBAN_VIEW_ALL), async (req, res) => {
    try {
        const boardId = BigInt(req.params.boardId);
        const { taskId, newStatus } = req.body;
        const result = await projectService.moveTaskOnBoard(req, boardId, taskId, newStatus);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.get('/:projectId/kanban/:boardId', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.PROJECT_KANBAN_VIEW_ALL), async (req, res) => {
    try {
        const projectId = BigInt(req.params.projectId);
        const result = await projectService.getKanbanView(req, projectId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=project-collaboration.routes.js.map