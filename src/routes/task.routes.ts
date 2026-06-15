import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { Task } from '@models/Task.model';
import { Project } from '@models/Project.model';
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
    if (req.query.projectId) where.projectId = BigInt(req.query.projectId as string);
    if (req.query.assigneeId) where.assigneeId = BigInt(req.query.assigneeId as string);
    if (req.query.search) {
      where[Op.or as unknown as string] = [
        { title: { [Op.like]: `%${req.query.search}%` } },
        { taskCode: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

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
    ResponseFormatter.success(res, task.toJSON());
  })
);

router.post(
  '/',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      title, description, taskCode,
      projectId, assigneeId,
      priority, status,
      startDate, dueDate,
      estimatedHours, label,
    } = req.body;

    const user = (req as unknown as { user?: { id: number } }).user;

    const task = await Task.create({
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

    ResponseFormatter.success(res, task.toJSON(), 'Task created successfully', 201);
  })
);

router.patch(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findByPk(req.params.id);
    if (!task) return ResponseFormatter.notFound(res, 'Task not found');

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
    await task.update({ status: req.body.status });
    ResponseFormatter.success(res, task.toJSON(), 'Task status updated');
  })
);

router.patch(
  '/:id/assign',
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
    await task.destroy();
    ResponseFormatter.success(res, null, 'Task deleted successfully');
  })
);

export default router;
