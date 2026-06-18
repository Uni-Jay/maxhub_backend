import { Router, Request, Response } from 'express';
import { EmployeePromotion } from '@models/EmployeePromotion.model';
import { Staff } from '@models/Staff.model';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';

const router = Router();

// GET /api/promotions
router.get('/', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_READ_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const promotions = await EmployeePromotion.findAll({
    where,
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
      { association: 'fromDesignation', attributes: ['id', 'name'] },
      { association: 'toDesignation', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  ResponseFormatter.success(res, promotions);
}));

// POST /api/promotions — propose a promotion (typically from an approved appraisal)
router.post('/', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_CREATE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { staffId, toDesignationId, toDepartmentId, effectiveDate, reason, salaryIncreasePercentage, newSalary } = req.body;
  if (!staffId || !toDesignationId || !effectiveDate) {
    return ResponseFormatter.error(res, 'staffId, toDesignationId and effectiveDate are required', 400);
  }

  const staff = await Staff.findByPk(staffId);
  if (!staff) return ResponseFormatter.notFound(res, 'Staff not found');

  const promotion = await EmployeePromotion.create({
    staffId: BigInt(staffId),
    fromDesignationId: (staff as any).designationId,
    toDesignationId: BigInt(toDesignationId),
    fromDepartmentId: (staff as any).departmentId,
    toDepartmentId: toDepartmentId ? BigInt(toDepartmentId) : (staff as any).departmentId,
    effectiveDate: new Date(effectiveDate),
    reason,
    promotedBy: BigInt((req as any).user.id),
    salaryIncreasePercentage: salaryIncreasePercentage ? Number(salaryIncreasePercentage) : undefined,
    newSalary: newSalary ? Number(newSalary) : undefined,
    status: 'Proposed',
  } as any);

  ResponseFormatter.success(res, promotion, 'Promotion proposed', 201);
}));

// PATCH /api/promotions/:id/approve — approves and immediately applies the promotion to the staff record
router.patch('/:id/approve', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_APPROVE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const promotion = await EmployeePromotion.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!promotion) return ResponseFormatter.notFound(res, 'Promotion not found');
  if (promotion.status !== 'Proposed') {
    return ResponseFormatter.error(res, 'Only proposed promotions can be approved', 400);
  }

  await promotion.update({
    status: 'Effective',
    approvalDate: new Date(),
    approvalRemarks: req.body.approvalRemarks,
  });

  const staff = await Staff.findByPk(promotion.staffId);
  if (staff) {
    await staff.update({
      designationId: promotion.toDesignationId,
      ...(promotion.toDepartmentId && { departmentId: promotion.toDepartmentId }),
    } as any);
  }

  ResponseFormatter.success(res, promotion, 'Promotion approved and applied');
}));

// PATCH /api/promotions/:id/reject
router.patch('/:id/reject', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_APPROVE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const promotion = await EmployeePromotion.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!promotion) return ResponseFormatter.notFound(res, 'Promotion not found');
  if (promotion.status !== 'Proposed') {
    return ResponseFormatter.error(res, 'Only proposed promotions can be rejected', 400);
  }

  await promotion.update({
    status: 'Rejected',
    rejectionReason: req.body.rejectionReason,
  });

  ResponseFormatter.success(res, promotion, 'Promotion rejected');
}));

// DELETE /api/promotions/:id
router.delete('/:id', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_DELETE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const promotion = await EmployeePromotion.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!promotion) return ResponseFormatter.notFound(res, 'Promotion not found');
  await promotion.destroy();
  ResponseFormatter.success(res, null, 'Promotion deleted');
}));

export default router;
