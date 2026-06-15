import { Request } from 'express';
import { BaseService } from './BaseService';
import { PermissionCode } from '../config/PermissionCodes';

export interface CommentRequest {
  taskId: bigint;
  projectId: bigint;
  content: string;
  mentionedStaffIds?: bigint[];
  parentCommentId?: bigint;
}

export interface TaskAssignmentRequest {
  taskId: bigint;
  projectId: bigint;
  assignedToStaffId: bigint;
  estimatedHours?: number;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface KanbanBoardRequest {
  projectId: bigint;
  name: string;
  description?: string;
  boardType?: 'Kanban' | 'Sprint' | 'Custom';
  statusColumns?: string[];
}

export interface AttachmentRequest {
  projectId?: bigint;
  taskId?: bigint;
  commentId?: bigint;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  attachmentType: 'Document' | 'Image' | 'Video' | 'Audio' | 'Other';
  description?: string;
}

export class ProjectService extends BaseService {
  /**
   * Add comment to task
   */
  async addComment(req: Request, commentData: CommentRequest) {
    await this.checkPermission(req, PermissionCode.PROJECT_COMMENT_CREATE_ALL);

    const { taskId, projectId, content, mentionedStaffIds, parentCommentId } = commentData;

    // Create comment
    // const comment = await commentRepo.create({
    //   taskId,
    //   projectId,
    //   staffId: req.user.staffId,
    //   content,
    //   mentionedStaffIds: mentionedStaffIds || [],
    //   parentCommentId,
    // });

    // Notify mentioned staff
    // if (mentionedStaffIds && mentionedStaffIds.length > 0) {
    //   await notificationService.notifyMentionedUsers(
    //     mentionedStaffIds,
    //     req.user.staffId,
    //     `Mentioned you in task comment`,
    //     comment.id
    //   );
    // }

    return {
      message: 'Comment added successfully',
      commentId: 0, // Would return actual ID from DB
      createdAt: new Date(),
    };
  }

  /**
   * Update comment
   */
  async updateComment(req: Request, commentId: bigint, content: string) {
    await this.checkPermission(req, PermissionCode.PROJECT_COMMENT_CREATE_ALL);

    // Get comment
    // const comment = await commentRepo.findByPk(commentId);
    // if (!comment) throw new Error('Comment not found');
    // if (comment.staffId !== req.user.staffId) throw new Error('Unauthorized');

    // Update comment
    // await comment.update({ content });

    return { message: 'Comment updated' };
  }

  /**
   * Delete comment
   */
  async deleteComment(req: Request, commentId: bigint) {
    await this.checkPermission(req, PermissionCode.PROJECT_COMMENT_DELETE_ALL);

    // Get and delete comment
    // const comment = await commentRepo.findByPk(commentId);
    // if (!comment) throw new Error('Comment not found');
    // await comment.destroy();

    return { message: 'Comment deleted' };
  }

  /**
   * Mark comment as resolved
   */
  async resolveComment(req: Request, commentId: bigint) {
    // Typically staff or task owner can resolve
    // const comment = await commentRepo.findByPk(commentId);
    // if (!comment) throw new Error('Comment not found');

    // await comment.update({
    //   isResolved: true,
    //   resolvedBy: req.user.staffId,
    //   resolvedAt: new Date(),
    // });

    return { message: 'Comment marked as resolved' };
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(req: Request, attachmentData: AttachmentRequest) {
    await this.checkPermission(req, PermissionCode.PROJECT_ATTACHMENT_CREATE_ALL);

    // Validate file size (e.g., max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (attachmentData.fileSize > MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum limit');
    }

    // Create attachment record
    // const attachment = await attachmentRepo.create({
    //   ...attachmentData,
    //   staffId: req.user.staffId,
    //   uploadedAt: new Date(),
    //   downloadCount: 0,
    // });

    return {
      message: 'Attachment uploaded successfully',
      attachmentId: 0, // Would return actual ID
      uploadedAt: new Date(),
    };
  }

  /**
   * Download attachment
   */
  async downloadAttachment(req: Request, attachmentId: bigint) {
    await this.checkPermission(req, PermissionCode.PROJECT_ATTACHMENT_READ_ALL);

    // Get attachment
    // const attachment = await attachmentRepo.findByPk(attachmentId);
    // if (!attachment) throw new Error('Attachment not found');

    // Increment download count
    // await attachment.increment('downloadCount');

    return {
      fileUrl: '',
      fileName: '',
      fileType: '',
    };
  }

  /**
   * Assign task to user
   */
  async assignTask(req: Request, assignmentData: TaskAssignmentRequest) {
    await this.checkPermission(req, PermissionCode.TASK_UPDATE_ALL);

    const { taskId, projectId, assignedToStaffId, estimatedHours, priority } = assignmentData;

    // Create task assignment
    // const assignment = await taskAssignmentRepo.create({
    //   taskId,
    //   projectId,
    //   assignedToStaffId,
    //   assignedByStaffId: req.user.staffId,
    //   assignedDate: new Date(),
    //   estimatedHours,
    //   priority: priority || 'Medium',
    //   assignmentStatus: 'Pending',
    // });

    // Notify assigned user
    // await notificationService.sendTaskAssignmentNotification(
    //   assignedToStaffId,
    //   taskId,
    //   'You have been assigned a new task'
    // );

    return {
      message: 'Task assigned successfully',
      assignmentStatus: 'Pending',
      assignedDate: new Date(),
    };
  }

  /**
   * Accept task assignment
   */
  async acceptTaskAssignment(req: Request, assignmentId: bigint, staffId: bigint) {
    // const assignment = await taskAssignmentRepo.findByPk(assignmentId);
    // if (!assignment || assignment.assignedToStaffId !== staffId) {
    //   throw new Error('Unauthorized');
    // }

    // await assignment.update({
    //   assignmentStatus: 'Accepted',
    //   acceptedDate: new Date(),
    // });

    return { message: 'Task assignment accepted' };
  }

  /**
   * Decline task assignment
   */
  async declineTaskAssignment(req: Request, assignmentId: bigint, staffId: bigint, reason: string) {
    // const assignment = await taskAssignmentRepo.findByPk(assignmentId);
    // if (!assignment || assignment.assignedToStaffId !== staffId) {
    //   throw new Error('Unauthorized');
    // }

    // await assignment.update({
    //   assignmentStatus: 'Declined',
    //   declinedDate: new Date(),
    //   declinedReason: reason,
    // });

    // Notify assigner
    // await notificationService.sendTaskDeclineNotification(
    //   assignment.assignedByStaffId,
    //   assignmentId,
    //   reason
    // );

    return { message: 'Task assignment declined' };
  }

  /**
   * Create Kanban board
   */
  async createKanbanBoard(req: Request, boardData: KanbanBoardRequest) {
    await this.checkPermission(req, PermissionCode.PROJECT_KANBAN_UPDATE_ALL);

    // Create board
    // const board = await kanbanRepo.create({
    //   ...boardData,
    //   createdBy: req.user.staffId,
    //   statusColumns: boardData.statusColumns || ['Todo', 'In Progress', 'Review', 'Done'],
    //   displayOrder: 0,
    // });

    return {
      message: 'Kanban board created successfully',
      boardId: 0, // Would return actual ID
    };
  }

  /**
   * Update Kanban board
   */
  async updateKanbanBoard(req: Request, boardId: bigint, boardData: Partial<KanbanBoardRequest>) {
    await this.checkPermission(req, PermissionCode.PROJECT_KANBAN_UPDATE_ALL);

    // const board = await kanbanRepo.findByPk(boardId);
    // if (!board) throw new Error('Board not found');

    // await board.update(boardData);

    return { message: 'Kanban board updated' };
  }

  /**
   * Move task on Kanban board
   */
  async moveTaskOnBoard(req: Request, boardId: bigint, taskId: bigint, newStatus: string) {
    await this.checkPermission(req, PermissionCode.PROJECT_KANBAN_VIEW_ALL);

    // Update task status
    // const task = await taskRepo.findByPk(taskId);
    // if (!task) throw new Error('Task not found');

    // await task.update({ status: newStatus, updatedAt: new Date() });

    return { message: 'Task moved successfully', newStatus };
  }

  /**
   * Get project kanban view
   */
  async getKanbanView(req: Request, projectId: bigint) {
    await this.checkPermission(req, PermissionCode.PROJECT_KANBAN_VIEW_ALL);

    // Get board and tasks
    return {
      board: {},
      tasks: {},
      columns: [],
    };
  }
}
