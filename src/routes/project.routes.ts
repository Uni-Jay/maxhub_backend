import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AuthMiddleware } from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';
import { Project } from '@models/Project.model';
import { Task } from '@models/Task.model';
import { Milestone } from '@models/Milestone.model';
import { Department } from '@models/Department.model';
import { Staff } from '@models/Staff.model';
import { ProjectComment } from '@models/ProjectComment.model';
import { Notification } from '@models/Notification.model';
import { notifyStaff } from '@utils/notify';

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

function isHod(req: Request): boolean {
  const roles = ((req as any).user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  return roles.includes('hod');
}

/**
 * "Own managed project" fallback — lets a staff member without an ALL permission
 * still manage a project they're personally listed as manager on (their own
 * personal project). HOD is deliberately excluded: she has no add/edit/delete
 * authority on projects at all, even ones she happens to be listed as manager on.
 */
function canAccessProject(req: Request, project: Project, staffId: bigint | null): boolean {
  if (isHod(req)) return false;
  if (!staffId) return false;
  return String(project.projectManagerId) === String(staffId);
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
    if (req.query.departmentId) where.departmentId = BigInt(req.query.departmentId as string);

    const andConditions: unknown[] = [];
    if (req.query.search) {
      andConditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: `%${req.query.search}%` } },
          { projectCode: { [Op.iLike]: `%${req.query.search}%` } },
        ],
      });
    }

    if (!hasPermission(req, PermissionCode.PROJECT_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      andConditions.push({ projectManagerId: staffId ?? -1 });
    }

    if (andConditions.length) where[Op.and as unknown as string] = andConditions;

    const { count, rows } = await Project.findAndCountAll({
      where,
      include: [
        { model: Department, attributes: ['id', 'name'], required: false },
        {
          model: Staff,
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

    ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
  })
);

router.get(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Staff, as: 'projectManager', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

    if (!hasPermission(req, PermissionCode.PROJECT_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessProject(req, project, staffId)) return ResponseFormatter.notFound(res, 'Project not found');
    }

    ResponseFormatter.success(res, project.toJSON());
  })
);

router.post(
  '/',
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_CREATE_ALL, PermissionCode.PROJECT_CREATE_OWN_DEPARTMENT, PermissionCode.PROJECT_CREATE_OWN),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const canCreateAll = hasPermission(req, PermissionCode.PROJECT_CREATE_ALL);
    const canCreateOwnDepartment = !canCreateAll && hasPermission(req, PermissionCode.PROJECT_CREATE_OWN_DEPARTMENT);
    const user = (req as any).user;
    const ownStaffId = await getOwnStaffId(req);

    const {
      name, description, projectCode,
      endDate, expectedEndDate,
      budget, status, priority,
    } = req.body;

    let departmentId: bigint;
    let projectManagerId: bigint;
    let startDate: Date;

    if (canCreateAll) {
      if (!req.body.departmentId || !req.body.projectManagerId) {
        return ResponseFormatter.error(res, 'departmentId and projectManagerId are required', 400);
      }
      departmentId = BigInt(req.body.departmentId);
      projectManagerId = BigInt(req.body.projectManagerId);
      startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    } else if (canCreateOwnDepartment) {
      // HOD: project is always created under her own department; the project manager
      // must be a staff member within that same department.
      if (!user?.departmentId) {
        return ResponseFormatter.error(res, 'No department linked to this account', 400);
      }
      if (!req.body.projectManagerId) {
        return ResponseFormatter.error(res, 'projectManagerId is required', 400);
      }
      const manager = await Staff.findByPk(req.body.projectManagerId, { attributes: ['id', 'departmentId'] });
      if (!manager || String((manager as any).departmentId) !== String(user.departmentId)) {
        return ResponseFormatter.forbidden(res, 'You can only assign a project manager from your own department', req.path);
      }
      departmentId = BigInt(user.departmentId);
      projectManagerId = BigInt(req.body.projectManagerId);
      startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    } else {
      // Personal project: staff self-manages it, scoped to their own department.
      if (!ownStaffId || !user?.departmentId) {
        return ResponseFormatter.error(res, 'No staff profile/department linked to this account', 400);
      }
      departmentId = BigInt(user.departmentId);
      projectManagerId = ownStaffId;
      startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    }

    const project = await Project.create({
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

    // Notify the assigned project manager — this is the only "add someone
    // to a project" action that exists today (there's no separate team-
    // member roster), and it previously notified nobody at all.
    if (String(projectManagerId) !== String(ownStaffId)) {
      const io = (req as any).app?.get('io');
      notifyStaff(projectManagerId, {
        type: 'Assignment',
        title: 'You were assigned as Project Manager',
        message: `You've been made the project manager for "${project.name}".`,
        relatedEntityType: 'Project',
        relatedEntityId: project.id,
        actionUrl: `/projects/${project.id}`,
        priority: 'High',
      }, io).catch(() => {});
    }

    ResponseFormatter.success(res, project.toJSON(), 'Project created successfully', 201);
  })
);

router.patch(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

    if (!hasPermission(req, PermissionCode.PROJECT_UPDATE_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessProject(req, project, staffId)) return ResponseFormatter.notFound(res, 'Project not found');
    }

    const {
      name, description, status, priority,
      endDate, expectedEndDate, progress, budget,
    } = req.body;

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

    ResponseFormatter.success(res, project.toJSON(), 'Project updated successfully');
  })
);

router.delete(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

    if (!hasPermission(req, PermissionCode.PROJECT_DELETE_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessProject(req, project, staffId)) return ResponseFormatter.notFound(res, 'Project not found');
    }

    await project.destroy();
    ResponseFormatter.success(res, null, 'Project deleted successfully');
  })
);

router.get(
  '/:id/tasks',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

    if (!hasPermission(req, PermissionCode.PROJECT_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessProject(req, project, staffId)) return ResponseFormatter.notFound(res, 'Project not found');
    }

    const tasks = await Task.findAll({
      where: { projectId: project.id },
      include: [
        { model: Staff, as: 'assignee', attributes: ['id', 'firstName', 'lastName'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    ResponseFormatter.success(res, tasks.map(t => t.toJSON()));
  })
);

router.get(
  '/:id/milestones',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

    const milestones = await Milestone.findAll({
      where: { projectId: project.id },
      order: [['dueDate', 'ASC']],
    });

    ResponseFormatter.success(res, milestones.map(m => m.toJSON()));
  })
);

router.get(
  '/:id/team',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    ResponseFormatter.success(res, []);
  })
);

// POST /api/projects/:id/comments — submit a report/update to the project manager
router.post(
  '/:id/comments',
  AuthMiddleware.requirePermission(PermissionCode.PROJECT_COMMENT_CREATE_ALL),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

    if (!hasPermission(req, PermissionCode.PROJECT_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessProject(req, project, staffId)) return ResponseFormatter.notFound(res, 'Project not found');
    }

    const { content } = req.body;
    if (!content) return ResponseFormatter.error(res, 'content is required', 400);

    const ownStaffId = await getOwnStaffId(req);
    if (!ownStaffId) return ResponseFormatter.error(res, 'No staff profile linked to this account', 400);

    const comment = await ProjectComment.create({
      projectId: project.id,
      staffId: ownStaffId,
      content,
    } as any);

    if (project.projectManagerId && String(project.projectManagerId) !== String(ownStaffId)) {
      const manager = await Staff.findByPk(project.projectManagerId as any, { attributes: ['userId'] });
      const managerUserId = (manager as any)?.userId;
      if (managerUserId) {
        await Notification.create({
          recipientUserId: managerUserId,
          notificationType: 'Assignment',
          title: 'New project report',
          message: `A report was submitted on project "${project.name}"`,
          relatedEntityType: 'Project',
          relatedEntityId: project.id,
          actionUrl: `/projects/${project.id}`,
          deliveryChannel: 'InApp',
          priority: 'Medium',
        } as any);
      }
    }

    ResponseFormatter.success(res, comment.toJSON(), 'Report submitted', 201);
  })
);

// GET /api/projects/:id/comments — list reports/updates for a project
router.get(
  '/:id/comments',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

    if (!hasPermission(req, PermissionCode.PROJECT_READ_ALL)) {
      const staffId = await getOwnStaffId(req);
      if (!canAccessProject(req, project, staffId)) return ResponseFormatter.notFound(res, 'Project not found');
    }

    const comments = await ProjectComment.findAll({
      where: { projectId: project.id },
      include: [{ model: Staff, as: 'author', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'ASC']],
    });

    ResponseFormatter.success(res, comments.map(c => c.toJSON()));
  })
);

export default router;
