import { Router, Request, Response } from 'express';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { LeaveRequest } from '@models/LeaveRequest.model';
import { LeaveBalance } from '@models/LeaveBalance.model';
import { LeaveType } from '@models/LeaveType.model';
import { Staff } from '@models/Staff.model';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';
import { isSuperAdminOnly, requesterIsHrOrAdmin } from '@utils/leaveApproval';

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
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      paranoid: true,
    });

    // The approver UI needs to know up front whether a given request
    // requires Super Admin sign-off (requester is HR/Admin) so it can hide
    // the Approve/Reject buttons for anyone else, rather than letting the
    // user click Approve and only find out from a 403.
    const enriched = await Promise.all(rows.map(async (r) => ({
      ...r.toJSON(),
      requiresSuperAdminApproval: await requesterIsHrOrAdmin((r as any).staffId),
    })));

    ResponseFormatter.paginated(res, enriched, count, page, limit);
  })
);

router.post(
  '/requests',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { leaveTypeId, startDate, endDate, reason, documentUrl } = req.body;
    const user = (req as unknown as { user?: { id: number } }).user;

    // The JWT payload has never carried a staffId field — user?.staffId was
    // always undefined, so every leave request ever submitted silently
    // landed on staff id 1 regardless of who actually submitted it. Every
    // submitter needs their own Staff row resolved from their real user id,
    // the same pattern attendance-management.routes.ts already uses.
    const staff = user?.id ? await Staff.findOne({ where: { userId: user.id }, attributes: ['id'] }) : null;
    if (!staff) return ResponseFormatter.error(res, 'No staff record found for this account', 400);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const numberofDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

    const leave = await LeaveRequest.create({
      leaveTypeId: BigInt(leaveTypeId),
      staffId: (staff as any).id,
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
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name'] },
      ],
    });
    if (!leave) return ResponseFormatter.notFound(res, 'Leave request not found');
    ResponseFormatter.success(res, {
      ...leave.toJSON(),
      requiresSuperAdminApproval: await requesterIsHrOrAdmin((leave as any).staffId),
    });
  })
);

router.patch(
  '/requests/:id/approve',
  AuthMiddleware.requirePermission(PermissionCode.LEAVE_REQUEST_APPROVE_ALL, PermissionCode.LEAVE_REQUEST_APPROVE_OWN_DEPARTMENT),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return ResponseFormatter.notFound(res, 'Leave request not found');
    if (leave.status !== 'Pending') {
      return ResponseFormatter.error(res, 'Only pending requests can be approved', 400);
    }
    // HR and Admin can approve everyone else's leave, but not a fellow
    // HR's or fellow Admin's — that's reserved for Super Admin.
    if (await requesterIsHrOrAdmin((leave as any).staffId) && !isSuperAdminOnly(req)) {
      return ResponseFormatter.forbidden(res, 'Only Super Admin can approve leave requests from HR or Admin staff', req.path);
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
  AuthMiddleware.requirePermission(PermissionCode.LEAVE_REQUEST_REJECT_ALL, PermissionCode.LEAVE_REQUEST_REJECT_OWN_DEPARTMENT),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return ResponseFormatter.notFound(res, 'Leave request not found');
    if (leave.status !== 'Pending') {
      return ResponseFormatter.error(res, 'Only pending requests can be rejected', 400);
    }
    // Same HR/Admin-vs-Super-Admin restriction as the approve route above.
    if (await requesterIsHrOrAdmin((leave as any).staffId) && !isSuperAdminOnly(req)) {
      return ResponseFormatter.forbidden(res, 'Only Super Admin can reject leave requests from HR or Admin staff', req.path);
    }

    await leave.update({
      status: 'Rejected',
      approvalComments: req.body.comments,
      approvalDate: new Date(),
    });

    ResponseFormatter.success(res, leave.toJSON(), 'Leave request rejected');
  })
);

/**
 * Core own-leave-balance aggregation — shared by the /api/leave/balance route and
 * the AI assistant's getLeaveSummary tool, so both surfaces stay behaviorally identical.
 */
export async function getLeaveBalance(staffId?: number) {
  const year = new Date().getFullYear();

  const balances = await LeaveBalance.findAll({
    where: {
      staffId: staffId ? BigInt(staffId) : BigInt(1),
      year,
    },
    include: [
      { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'code'], required: false },
    ],
  });

  const plain = balances.map(b => b.toJSON()) as unknown as Array<{
    totalDays: number;
    usedDays: number;
    remainingDays: number;
  }>;

  return {
    total: plain.reduce((sum, b) => sum + Number(b.totalDays), 0),
    used: plain.reduce((sum, b) => sum + Number(b.usedDays), 0),
    available: plain.reduce((sum, b) => sum + Number(b.remainingDays), 0),
    leaveTypes: plain,
  };
}

router.get(
  '/balance',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const user = (req as unknown as { user?: { staffId?: number } }).user;
    const data = await getLeaveBalance(user?.staffId);
    ResponseFormatter.success(res, data);
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
