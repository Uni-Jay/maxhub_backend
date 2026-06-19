import { Router, Request, Response } from 'express';
import { EmployeePromotion } from '@models/EmployeePromotion.model';
import { Staff } from '@models/Staff.model';
import { Designation } from '@models/Designation.model';
import { Department } from '@models/Department.model';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';
import { sendPromotionEmail } from '@services/CommunicationService';

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

function isDepartmentScopedOnly(req: Request, allCode: string, deptCode: string): boolean {
  return !hasPermission(req, allCode) && hasPermission(req, deptCode);
}

/**
 * Approving a promotion is deliberately Super Admin-only — HR and Admin can
 * both recommend, but neither can approve their own (or each other's)
 * recommendation. Admin normally bypasses every requirePermission() check,
 * so that bypass is intentionally NOT used here — this checks the literal
 * role string instead of going through hasPermission()/isBypassRole().
 */
function isSuperAdminOnly(req: Request): boolean {
  const roles = ((req as any).user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  return roles.includes('superadmin');
}

async function getOwnStaff(req: Request) {
  const userId = (req as any).user?.id;
  if (!userId) return null;
  return Staff.findOne({ where: { userId }, attributes: ['id', 'departmentId'] });
}

// GET /api/promotions
router.get('/', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_READ_ALL, PermissionCode.HR_PROMOTION_READ_OWN_DEPARTMENT), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const staffInclude: Record<string, unknown> = { model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'employeeId'] };
  if (isDepartmentScopedOnly(req, PermissionCode.HR_PROMOTION_READ_ALL, PermissionCode.HR_PROMOTION_READ_OWN_DEPARTMENT)) {
    const ownStaff = await getOwnStaff(req);
    (staffInclude as any).where = { departmentId: ownStaff?.departmentId ?? -1 };
    (staffInclude as any).required = true;
  }

  const promotions = await EmployeePromotion.findAll({
    where,
    include: [
      staffInclude,
      { association: 'fromDesignation', attributes: ['id', 'name'] },
      { association: 'toDesignation', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  ResponseFormatter.success(res, promotions);
}));

// POST /api/promotions — propose a promotion (typically from an approved appraisal)
router.post('/', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_CREATE_ALL, PermissionCode.HR_PROMOTION_CREATE_OWN_DEPARTMENT), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { staffId, toDesignationId, toDepartmentId, effectiveDate, reason, salaryIncreasePercentage, newSalary } = req.body;
  if (!staffId || !toDesignationId || !effectiveDate) {
    return ResponseFormatter.error(res, 'staffId, toDesignationId and effectiveDate are required', 400);
  }

  const staff = await Staff.findByPk(staffId);
  if (!staff) return ResponseFormatter.notFound(res, 'Staff not found');

  const deptScopedCreate = isDepartmentScopedOnly(req, PermissionCode.HR_PROMOTION_CREATE_ALL, PermissionCode.HR_PROMOTION_CREATE_OWN_DEPARTMENT);
  if (deptScopedCreate) {
    const ownStaff = await getOwnStaff(req);
    if (String(ownStaff?.id) === String(staffId)) {
      return ResponseFormatter.forbidden(res, 'You cannot recommend yourself for promotion', req.path);
    }
    if (!ownStaff?.departmentId || String((staff as any).departmentId) !== String(ownStaff.departmentId)) {
      return ResponseFormatter.forbidden(res, 'You can only recommend staff in your own department', req.path);
    }
  }

  const promotion = await EmployeePromotion.create({
    staffId: BigInt(staffId),
    fromDesignationId: (staff as any).designationId,
    toDesignationId: BigInt(toDesignationId),
    fromDepartmentId: (staff as any).departmentId,
    // Department-scoped recommenders (HOD) can never move the staff member to a different department.
    toDepartmentId: (!deptScopedCreate && toDepartmentId) ? BigInt(toDepartmentId) : (staff as any).departmentId,
    effectiveDate: new Date(effectiveDate),
    reason,
    promotedBy: BigInt((req as any).user.id),
    salaryIncreasePercentage: salaryIncreasePercentage ? Number(salaryIncreasePercentage) : undefined,
    newSalary: newSalary ? Number(newSalary) : undefined,
    status: 'Proposed',
  } as any);

  ResponseFormatter.success(res, promotion, 'Promotion proposed', 201);
}));

// PATCH /api/promotions/:id/approve — Super Admin only. Approves, applies the
// promotion to the staff record, and emails the promoted staff member.
router.patch('/:id/approve', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_APPROVE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  if (!isSuperAdminOnly(req)) {
    return ResponseFormatter.forbidden(res, 'Only Super Admin can approve promotions', req.path);
  }

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

    const [designation, department] = await Promise.all([
      promotion.toDesignationId ? Designation.findByPk(promotion.toDesignationId, { attributes: ['name'] }) : null,
      promotion.toDepartmentId ? Department.findByPk(promotion.toDepartmentId, { attributes: ['name'] }) : null,
    ]);

    if ((staff as any).email) {
      sendPromotionEmail({
        to: (staff as any).email,
        firstName: (staff as any).firstName,
        lastName: (staff as any).lastName,
        newDesignation: (designation as any)?.name,
        newDepartment: (department as any)?.name,
        effectiveDate: promotion.effectiveDate,
        approvalRemarks: req.body.approvalRemarks,
      }).catch(err => console.error('[Promotion] Approval email failed:', err));
    }
  }

  ResponseFormatter.success(res, promotion, 'Promotion approved, applied, and the staff member has been notified');
}));

// PATCH /api/promotions/:id/reject — Super Admin only.
router.patch('/:id/reject', AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_APPROVE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  if (!isSuperAdminOnly(req)) {
    return ResponseFormatter.forbidden(res, 'Only Super Admin can reject promotions', req.path);
  }

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
