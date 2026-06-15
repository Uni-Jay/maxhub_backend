"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const BaseService_1 = require("./BaseService");
const PermissionCodes_1 = require("../config/PermissionCodes");
class ProjectService extends BaseService_1.BaseService {
    async addComment(req, commentData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_COMMENT_CREATE_ALL);
        const { taskId, projectId, content, mentionedStaffIds, parentCommentId } = commentData;
        return {
            message: 'Comment added successfully',
            commentId: 0,
            createdAt: new Date(),
        };
    }
    async updateComment(req, commentId, content) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_COMMENT_CREATE_ALL);
        return { message: 'Comment updated' };
    }
    async deleteComment(req, commentId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_COMMENT_DELETE_ALL);
        return { message: 'Comment deleted' };
    }
    async resolveComment(req, commentId) {
        return { message: 'Comment marked as resolved' };
    }
    async uploadAttachment(req, attachmentData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_ATTACHMENT_CREATE_ALL);
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (attachmentData.fileSize > MAX_FILE_SIZE) {
            throw new Error('File size exceeds maximum limit');
        }
        return {
            message: 'Attachment uploaded successfully',
            attachmentId: 0,
            uploadedAt: new Date(),
        };
    }
    async downloadAttachment(req, attachmentId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_ATTACHMENT_READ_ALL);
        return {
            fileUrl: '',
            fileName: '',
            fileType: '',
        };
    }
    async assignTask(req, assignmentData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.TASK_UPDATE_ALL);
        const { taskId, projectId, assignedToStaffId, estimatedHours, priority } = assignmentData;
        return {
            message: 'Task assigned successfully',
            assignmentStatus: 'Pending',
            assignedDate: new Date(),
        };
    }
    async acceptTaskAssignment(req, assignmentId, staffId) {
        return { message: 'Task assignment accepted' };
    }
    async declineTaskAssignment(req, assignmentId, staffId, reason) {
        return { message: 'Task assignment declined' };
    }
    async createKanbanBoard(req, boardData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_KANBAN_UPDATE_ALL);
        return {
            message: 'Kanban board created successfully',
            boardId: 0,
        };
    }
    async updateKanbanBoard(req, boardId, boardData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_KANBAN_UPDATE_ALL);
        return { message: 'Kanban board updated' };
    }
    async moveTaskOnBoard(req, boardId, taskId, newStatus) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_KANBAN_VIEW_ALL);
        return { message: 'Task moved successfully', newStatus };
    }
    async getKanbanView(req, projectId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.PROJECT_KANBAN_VIEW_ALL);
        return {
            board: {},
            tasks: {},
            columns: [],
        };
    }
}
exports.ProjectService = ProjectService;
//# sourceMappingURL=ProjectService.js.map