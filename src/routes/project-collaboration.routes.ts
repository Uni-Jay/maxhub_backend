import { Router, Request, Response } from 'express';
import AuthMiddleware from '../middleware/AuthMiddleware';
import { PermissionCode } from '../config/PermissionCodes';
import { ProjectService, CommentRequest, TaskAssignmentRequest, KanbanBoardRequest, AttachmentRequest } from '../services/ProjectService';

const router = Router();
const projectService = new (ProjectService as any)() as InstanceType<typeof ProjectService>;

router.post(
  '/:projectId/comments',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_COMMENT_CREATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const projectId = BigInt(req.params.projectId);
      const commentData: CommentRequest = { ...req.body, projectId };
      const result = await projectService.addComment(req, commentData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/:projectId/comments/:commentId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_COMMENT_CREATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const commentId = BigInt(req.params.commentId);
      const result = await projectService.updateComment(req, commentId, req.body.content);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.delete(
  '/:projectId/comments/:commentId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_COMMENT_DELETE_ALL),
  async (req: Request, res: Response) => {
    try {
      const commentId = BigInt(req.params.commentId);
      const result = await projectService.deleteComment(req, commentId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/:projectId/comments/:commentId/resolve',
  AuthMiddleware.verifyToken,
  async (req: Request, res: Response) => {
    try {
      const commentId = BigInt(req.params.commentId);
      const result = await projectService.resolveComment(req, commentId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.post(
  '/:projectId/attachments',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_ATTACHMENT_CREATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const projectId = BigInt(req.params.projectId);
      const attachmentData: AttachmentRequest = { ...req.body, projectId };
      const result = await projectService.uploadAttachment(req, attachmentData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.get(
  '/:projectId/attachments/:attachmentId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_ATTACHMENT_READ_ALL),
  async (req: Request, res: Response) => {
    try {
      const attachmentId = BigInt(req.params.attachmentId);
      const result = await projectService.downloadAttachment(req, attachmentId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.post(
  '/:projectId/tasks/assign',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.TASK_UPDATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const projectId = BigInt(req.params.projectId);
      const assignmentData: TaskAssignmentRequest = { ...req.body, projectId };
      const result = await projectService.assignTask(req, assignmentData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/:projectId/tasks/assignments/:assignmentId/accept',
  AuthMiddleware.verifyToken,
  async (req: Request, res: Response) => {
    try {
      const assignmentId = BigInt(req.params.assignmentId);
      const staffId = (req as any).user.staffId;
      const result = await projectService.acceptTaskAssignment(req, assignmentId, staffId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/:projectId/tasks/assignments/:assignmentId/decline',
  AuthMiddleware.verifyToken,
  async (req: Request, res: Response) => {
    try {
      const assignmentId = BigInt(req.params.assignmentId);
      const staffId = (req as any).user.staffId;
      const reason = req.body.reason || '';
      const result = await projectService.declineTaskAssignment(req, assignmentId, staffId, reason);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.post(
  '/:projectId/kanban',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_KANBAN_UPDATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const projectId = BigInt(req.params.projectId);
      const boardData: KanbanBoardRequest = { ...req.body, projectId };
      const result = await projectService.createKanbanBoard(req, boardData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/:projectId/kanban/:boardId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_KANBAN_UPDATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const boardId = BigInt(req.params.boardId);
      const result = await projectService.updateKanbanBoard(req, boardId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/:projectId/kanban/:boardId/move-task',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_KANBAN_VIEW_ALL),
  async (req: Request, res: Response) => {
    try {
      const boardId = BigInt(req.params.boardId);
      const { taskId, newStatus } = req.body;
      const result = await projectService.moveTaskOnBoard(req, boardId, taskId, newStatus);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.get(
  '/:projectId/kanban/:boardId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_KANBAN_VIEW_ALL),
  async (req: Request, res: Response) => {
    try {
      const projectId = BigInt(req.params.projectId);
      const result = await projectService.getKanbanView(req, projectId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

export default router;
