import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AuthMiddleware } from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';
import { getRoleBucket } from '@utils/RoleBucket';
import { Task } from '@models/Task.model';
import { Project } from '@models/Project.model';
import { Staff } from '@models/Staff.model';
import { ProjectComment } from '@models/ProjectComment.model';
import { Notification } from '@models/Notification.model';

const router = Router();

function isBypassRole(req: Request): boolean {
  const roles = ((req as any).user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  return roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin');
}

function hasPermission(req: Request, code: string): boolean {
  if (isBypassRole(req)) return true;
  const perms = new Set(((req as any).user?.permissions || []).map((p: string) => String(p).toLowerCase()));
  return perms.has(code.toLowerCase());
}

async function getOwnStaffId(req: Request): Promise<bigint | null> {
  const userId = (req as any).user?.id;
  if (!userId) return null;
  const staff = await Staff.findOne({ where: { userId }, attributes: ['id'] });
  return staff ? (staff as any).id : null;
}

function canAccessTask(task: Task, staffId: bigint | null): boolean {
  if (!staffId) return false;
  return String(task.assigneeId) === String(staffId) || String(task.reporterId) === String(staffId);
}

router.get(
  '/',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.projectId) where.projectId = BigInt(req.query.projectId as string);
    if (req.query.assigneeId) where.assigneeId = BigInt(req.query.assigneeId as string);

    const andConditions: unknown[] = [];
    if (req.query.search) {
      andConditions.push({
        [Op.or]: [
          { title: { [Op.iLike]: `%${req.query.search}%` } },
          { taskCode: { [Op.iLike]: `%${req.query.search}%` } },
        ],
      });
    }

    if (!hasPermission(req, PermissionCode.TASK_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      andConditions.push({
        [Op.or]: [{ assigneeId: staffId ?? -1 }, { reporterId: staffId ?? -1 }],
      });
    }

    if (andConditions.length) where[Op.and as unknown as string] = andConditions;

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [
        { model: Project, attributes: ['id', 'name'], required: false },
        {
          model: Staff,
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

    ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
  })
);

router.get(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: Project, attributes: ['id', 'name', 'projectCode'] },
        { model: Staff, as: 'assignee', attributes: ['id', 'firstName', 'lastName'], required: false },
      ],
    });
    if (!task) return ResponseFormatter.notFound(res, 'Task not found');

    if (!hasPermission(req, PermissionCode.TASK_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessTask(task, staffId)) return ResponseFormatter.notFound(res, 'Task not found');
    }

    ResponseFormatter.success(res, task.toJSON());
  })
);

router.post(
  '/',
  AuthMiddleware.requirePermission(PermissionCode.TASK_CREATE_ALL, PermissionCode.TASK_CREATE_OWN),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const canCreateAll = hasPermission(req, PermissionCode.TASK_CREATE_ALL);
    const user = (req as any).user;
    const ownStaffId = await getOwnStaffId(req);
    const reporterId = ownStaffId ?? BigInt(user?.id || 1);

    const {
      title, description, taskCode,
      priority, status,
      startDate, dueDate,
      estimatedHours, label,
    } = req.body;

    let projectId: bigint | undefined;
    let assigneeId: bigint | undefined;

    if (canCreateAll) {
      if (!req.body.projectId) return ResponseFormatter.error(res, 'projectId is required', 400);
      projectId = BigInt(req.body.projectId);
      assigneeId = req.body.assigneeId ? BigInt(req.body.assigneeId) : undefined;
    } else {
      // Personal task: staff can only create a task for themselves, not tied to a project.
      projectId = undefined;
      assigneeId = ownStaffId ?? undefined;
    }

    const task = await Task.create({
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

    ResponseFormatter.success(res, task.toJSON(), 'Task created successfully', 201);
  })
);

router.patch(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findByPk(req.params.id);
    if (!task) return ResponseFormatter.notFound(res, 'Task not found');

    if (!hasPermission(req, PermissionCode.TASK_UPDATE_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessTask(task, staffId)) return ResponseFormatter.notFound(res, 'Task not found');
    }

    const {
      title, description, status, priority,
      dueDate, progress, actualHours, label,
    } = req.body;

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

    ResponseFormatter.success(res, task.toJSON(), 'Task updated successfully');
  })
);

router.patch(
  '/:id/status',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findByPk(req.params.id);
    if (!task) return ResponseFormatter.notFound(res, 'Task not found');

    if (!hasPermission(req, PermissionCode.TASK_UPDATE_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessTask(task, staffId)) return ResponseFormatter.notFound(res, 'Task not found');
    }

    await task.update({ status: req.body.status });
    ResponseFormatter.success(res, task.toJSON(), 'Task status updated');
  })
);

router.patch(
  '/:id/assign',
  AuthMiddleware.requirePermission(PermissionCode.TASK_UPDATE_ALL),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findByPk(req.params.id);
    if (!task) return ResponseFormatter.notFound(res, 'Task not found');
    await task.update({ assigneeId: BigInt(req.body.assigneeId) });
    ResponseFormatter.success(res, task.toJSON(), 'Task assigned successfully');
  })
);

router.delete(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findByPk(req.params.id);
    if (!task) return ResponseFormatter.notFound(res, 'Task not found');

    if (!hasPermission(req, PermissionCode.TASK_DELETE_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessTask(task, staffId)) return ResponseFormatter.notFound(res, 'Task not found');
    }

    await task.destroy();
    ResponseFormatter.success(res, null, 'Task deleted successfully');
  })
);

// POST /api/tasks/:id/comments — submit a report/update to whoever assigned the task
router.post(
  '/:id/comments',
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_COMMENT_CREATE_ALL),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findByPk(req.params.id);
    if (!task) return ResponseFormatter.notFound(res, 'Task not found');

    if (!hasPermission(req, PermissionCode.TASK_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessTask(task, staffId)) return ResponseFormatter.notFound(res, 'Task not found');
    }

    const { content } = req.body;
    if (!content) return ResponseFormatter.error(res, 'content is required', 400);

    const ownStaffId = await getOwnStaffId(req);
    if (!ownStaffId) return ResponseFormatter.error(res, 'No staff profile linked to this account', 400);

    const comment = await ProjectComment.create({
      taskId: task.id,
      projectId: task.projectId,
      staffId: ownStaffId,
      content,
    } as any);

    if (task.reporterId && String(task.reporterId) !== String(ownStaffId)) {
      const assigner = await Staff.findByPk(task.reporterId as any, { attributes: ['userId'] });
      const assignerUserId = (assigner as any)?.userId;
      if (assignerUserId) {
        await Notification.create({
          recipientUserId: assignerUserId,
          notificationType: 'Assignment',
          title: 'New task report',
          message: `A report was submitted on task "${task.title}"`,
          relatedEntityType: 'Task',
          relatedEntityId: task.id,
          actionUrl: `/tasks/${task.id}`,
          deliveryChannel: 'InApp',
          priority: 'Medium',
        } as any);
      }
    }

    ResponseFormatter.success(res, comment.toJSON(), 'Report submitted', 201);
  })
);

// GET /api/tasks/:id/comments — list reports/updates for a task
router.get(
  '/:id/comments',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findByPk(req.params.id);
    if (!task) return ResponseFormatter.notFound(res, 'Task not found');

    if (!hasPermission(req, PermissionCode.TASK_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessTask(task, staffId)) return ResponseFormatter.notFound(res, 'Task not found');
    }

    const comments = await ProjectComment.findAll({
      where: { taskId: task.id },
      include: [{ model: Staff, as: 'author', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'ASC']],
    });

    ResponseFormatter.success(res, comments.map(c => c.toJSON()));
  })
);

/**
 * Role-scoped "pending tasks" summary — used by the AI assistant's getMyTasks
 * tool, mirroring the same OWN/department/company-wide scoping as the GET /
 * list route above so the AI never sees more than the user's dashboard would.
 */
export async function getPendingTasksSummary(req: Request) {
  const bucket = getRoleBucket(req);
  const where: Record<string, unknown> = { status: { [Op.notIn]: ['Done', 'Cancelled'] } };

  if (bucket === 'staff') {
    const staffId = await getOwnStaffId(req);
    where[Op.or as unknown as string] = [{ assigneeId: staffId ?? -1 }, { reporterId: staffId ?? -1 }];
  } else if (bucket === 'hod') {
    const departmentId = (req as any).user?.departmentId;
    const deptStaff = await Staff.findAll({ where: { departmentId: departmentId ?? -1 }, attributes: ['id'] });
    const staffIds = deptStaff.map((s: any) => s.id);
    where.assigneeId = { [Op.in]: staffIds.length ? staffIds : [-1] };
  }
  // hr / admin / superadmin: company-wide, no extra filter.

  const tasks = await Task.findAll({
    where,
    include: [
      { model: Project, attributes: ['id', 'name'], required: false },
      { model: Staff, as: 'assignee', attributes: ['id', 'firstName', 'lastName'], required: false },
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
      project: (t as any).project?.name ?? (t.projectId ? undefined : 'Personal task'),
      assignee: (t as any).assignee ? `${(t as any).assignee.firstName} ${(t as any).assignee.lastName}` : undefined,
    })),
  };
}

export default router;
