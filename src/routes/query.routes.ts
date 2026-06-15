import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import AuthMiddleware from '../middleware/AuthMiddleware';
import { StaffQuery } from '../models/StaffQuery.model';
import { StaffQueryReply } from '../models/StaffQueryReply.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

const router = Router();

// GET /api/queries - list all queries with filters + stats
router.get(
  '/',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { status, priority, type, assignedStaffId, departmentId, search, page = '1', limit = '20' } =
      req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (assignedStaffId) where.assignedStaffId = BigInt(assignedStaffId);
    if (departmentId) where.departmentId = BigInt(departmentId);
    if (search) {
      (where as any)[Op.or as unknown as string] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await StaffQuery.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Dashboard stats
    const [total, pending, inProgress, resolved, overdue] = await Promise.all([
      StaffQuery.count(),
      StaffQuery.count({ where: { status: 'Pending' } }),
      StaffQuery.count({ where: { status: 'InProgress' } }),
      StaffQuery.count({ where: { status: 'Resolved' } }),
      StaffQuery.count({
        where: {
          status: { [Op.notIn]: ['Resolved', 'Closed'] },
          dueDate: { [Op.lt]: new Date() },
        },
      }),
    ]);

    res.json({
      success: true,
      data: rows,
      stats: { total, pending, inProgress, resolved, overdue },
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  })
);

// GET /api/queries/stats - dashboard stats only
router.get(
  '/stats',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const [total, pending, inProgress, resolved, closed, overdue] = await Promise.all([
      StaffQuery.count(),
      StaffQuery.count({ where: { status: 'Pending' } }),
      StaffQuery.count({ where: { status: 'InProgress' } }),
      StaffQuery.count({ where: { status: 'Resolved' } }),
      StaffQuery.count({ where: { status: 'Closed' } }),
      StaffQuery.count({
        where: {
          status: { [Op.notIn]: ['Resolved', 'Closed'] },
          dueDate: { [Op.lt]: new Date() },
        },
      }),
    ]);
    ResponseFormatter.success(res, { total, pending, inProgress, resolved, closed, overdue });
  })
);

// GET /api/queries/:id - get single query with replies
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const query = await StaffQuery.findByPk(req.params.id);
    if (!query) return ResponseFormatter.notFound(res, 'Query not found');

    const replies = await StaffQueryReply.findAll({
      where: { queryId: query.id },
      order: [['createdAt', 'ASC']],
    });

    ResponseFormatter.success(res, { ...query.toJSON(), replies: replies.map((r) => r.toJSON()) });
  })
);

// POST /api/queries - create new query
router.post(
  '/',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      priority = 'Medium',
      type = 'Query',
      departmentId,
      assignedStaffId,
      dueDate,
      attachments,
    } = req.body;
    const userId = (req as any).user?.id || 1;

    const query = await StaffQuery.create({
      title,
      description,
      priority,
      type,
      departmentId: departmentId ? BigInt(departmentId) : undefined,
      assignedStaffId: assignedStaffId ? BigInt(assignedStaffId) : undefined,
      createdByUserId: BigInt(userId),
      status: 'Pending',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      attachments: attachments ? JSON.stringify(attachments) : undefined,
    });

    ResponseFormatter.success(res, query.toJSON(), 'Query created successfully', 201);
  })
);

// PATCH /api/queries/:id - update query
router.patch(
  '/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const query = await StaffQuery.findByPk(req.params.id);
    if (!query) return ResponseFormatter.notFound(res, 'Query not found');

    const updates: Record<string, unknown> = {};
    const allowed = ['title', 'description', 'priority', 'type', 'status', 'dueDate', 'assignedStaffId', 'departmentId'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'assignedStaffId' || key === 'departmentId') {
          updates[key] = req.body[key] ? BigInt(req.body[key]) : null;
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    if (req.body.status === 'Resolved') updates.resolvedAt = new Date();
    if (req.body.status === 'Closed') updates.closedAt = new Date();

    await query.update(updates);
    ResponseFormatter.success(res, query.toJSON(), 'Query updated');
  })
);

// DELETE /api/queries/:id
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const query = await StaffQuery.findByPk(req.params.id);
    if (!query) return ResponseFormatter.notFound(res, 'Query not found');
    await query.destroy();
    ResponseFormatter.success(res, null, 'Query deleted');
  })
);

// POST /api/queries/:id/replies - add a reply
router.post(
  '/:id/replies',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const query = await StaffQuery.findByPk(req.params.id);
    if (!query) return ResponseFormatter.notFound(res, 'Query not found');

    const { message, isInternal = false, attachments } = req.body;
    const userId = (req as any).user?.id || 1;

    const reply = await StaffQueryReply.create({
      queryId: query.id,
      message,
      senderUserId: BigInt(userId),
      isInternal: Boolean(isInternal),
      attachments: attachments ? JSON.stringify(attachments) : undefined,
    });

    // Auto-update query status to InProgress when staff replies
    if (query.status === 'Pending') {
      await query.update({ status: 'InProgress' });
    }

    ResponseFormatter.success(res, reply.toJSON(), 'Reply added', 201);
  })
);

// PATCH /api/queries/:id/resolve
router.patch(
  '/:id/resolve',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const query = await StaffQuery.findByPk(req.params.id);
    if (!query) return ResponseFormatter.notFound(res, 'Query not found');
    await query.update({ status: 'Resolved', resolvedAt: new Date() });
    ResponseFormatter.success(res, query.toJSON(), 'Query marked as resolved');
  })
);

export default router;
