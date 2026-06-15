import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { Project } from '@models/Project.model';
import { Task } from '@models/Task.model';
import { Milestone } from '@models/Milestone.model';
import { Department } from '@models/Department.model';
import { Staff } from '@models/Staff.model';

const router = Router();

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
    if (req.query.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { projectCode: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

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
    ResponseFormatter.success(res, project.toJSON());
  })
);

router.post(
  '/',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      name, description, projectCode,
      departmentId, projectManagerId,
      startDate, endDate, expectedEndDate,
      budget, status, priority,
    } = req.body;

    const project = await Project.create({
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

    ResponseFormatter.success(res, project.toJSON(), 'Project created successfully', 201);
  })
);

router.patch(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

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

router.get(
  '/:id/tasks',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return ResponseFormatter.notFound(res, 'Project not found');

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

export default router;
