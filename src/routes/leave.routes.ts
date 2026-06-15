import { Router, Request, Response } from 'express';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { LeaveRequest } from '@models/LeaveRequest.model';
import { LeaveBalance } from '@models/LeaveBalance.model';
import { LeaveType } from '@models/LeaveType.model';
import { Staff } from '@models/Staff.model';

const router = Router();

router.get(
  '/requests',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.staffId) where.staffId = BigInt(req.query.staffId as string);

    const { count, rows } = await LeaveRequest.findAndCountAll({
      where,
      include: [
        {
          model: Staff,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName', 'employeeId'],
          required: false,
        },
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['id', 'name', 'color'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      paranoid: true,
    });

    ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
  })
);

router.post(
  '/requests',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { leaveTypeId, startDate, endDate, reason, documentUrl } = req.body;
    const user = (req as unknown as { user?: { id: number; staffId?: number } }).user;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const numberofDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

    const leave = await LeaveRequest.create({
      leaveTypeId: BigInt(leaveTypeId),
      staffId: BigInt(user?.staffId || 1),
      startDate: start,
      endDate: end,
      numberofDays,
      reason,
      documentUrl,
      status: 'Pending',
    });

    ResponseFormatter.success(res, leave.toJSON(), 'Leave request submitted successfully', 201);
  })
);

router.get(
  '/requests/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const leave = await LeaveRequest.findByPk(req.params.id, {
      include: [
        { model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName'] },
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color'] },
      ],
    });
    if (!leave) return ResponseFormatter.notFound(res, 'Leave request not found');
    ResponseFormatter.success(res, leave.toJSON());
  })
);

router.patch(
  '/requests/:id/approve',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return ResponseFormatter.notFound(res, 'Leave request not found');
    if (leave.status !== 'Pending') {
      return ResponseFormatter.error(res, 'Only pending requests can be approved', 400);
    }

    const user = (req as unknown as { user?: { id: number } }).user;
    await leave.update({
      status: 'Approved',
      approverUserId: user?.id ? BigInt(user.id) : undefined,
      approvalComments: req.body.comments,
      approvalDate: new Date(),
    });

    ResponseFormatter.success(res, leave.toJSON(), 'Leave request approved');
  })
);

router.patch(
  '/requests/:id/reject',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return ResponseFormatter.notFound(res, 'Leave request not found');
    if (leave.status !== 'Pending') {
      return ResponseFormatter.error(res, 'Only pending requests can be rejected', 400);
    }

    await leave.update({
      status: 'Rejected',
      approvalComments: req.body.comments,
      approvalDate: new Date(),
    });

    ResponseFormatter.success(res, leave.toJSON(), 'Leave request rejected');
  })
);

router.get(
  '/balance',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const user = (req as unknown as { user?: { staffId?: number } }).user;
    const year = new Date().getFullYear();

    const balances = await LeaveBalance.findAll({
      where: {
        staffId: user?.staffId ? BigInt(user.staffId) : BigInt(1),
        year,
      },
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color'], required: false },
      ],
    });

    const plain = balances.map(b => b.toJSON()) as unknown as Array<{
      totalDays: number;
      usedDays: number;
      remainingDays: number;
    }>;

    ResponseFormatter.success(res, {
      total: plain.reduce((sum, b) => sum + Number(b.totalDays), 0),
      used: plain.reduce((sum, b) => sum + Number(b.usedDays), 0),
      available: plain.reduce((sum, b) => sum + Number(b.remainingDays), 0),
      leaveTypes: plain,
    });
  })
);

router.get(
  '/types',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const types = await LeaveType.findAll({ order: [['name', 'ASC']] });
    ResponseFormatter.success(res, types.map(t => t.toJSON()));
  })
);

export default router;
