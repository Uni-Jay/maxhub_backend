import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { FeeReceipt } from '@models/FeeReceipt.model';
import { Enrollment } from '@models/Enrollment.model';
import { Course } from '@models/Course.model';
import { Staff } from '@models/Staff.model';
import { StudentProfile } from '@models/StudentProfile.model';
import { User } from '@models/User.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// Same department-scoping pattern used across the LMS routes — HOD-style
// callers hold the *_OWN_DEPARTMENT permission instead of *_ALL.
function getDeptScope(req: Request, allPermission: string): { scoped: boolean; departmentId: number | null } {
  const user = (req as any).user;
  const normRoles = (user.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  if (normRoles.includes('superadmin') || normRoles.includes('admin') || normRoles.includes('headofadmin')) {
    return { scoped: false, departmentId: null };
  }
  const perms = new Set((user.permissions || []).map((p: string) => p.toLowerCase()));
  if (perms.has(allPermission.toLowerCase())) {
    return { scoped: false, departmentId: null };
  }
  return { scoped: true, departmentId: user.departmentId ?? null };
}

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  return `REC-${year}-${Date.now().toString(36).toUpperCase()}`;
}

// GET /api/fee-receipts — list, auto-scoped to caller's own department unless they hold the _ALL permission
router.get('/', AuthMiddleware.requirePermission('LMS.FEE_RECEIPT.READ.ALL', 'LMS.FEE_RECEIPT.READ.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const scope = getDeptScope(req, 'lms.fee_receipt.read.all');

  const courseWhere: any = {};
  if (scope.scoped) {
    if (!scope.departmentId) return ResponseFormatter.success(res, []);
    courseWhere.departmentId = scope.departmentId;
  }

  const receipts = await FeeReceipt.findAll({
    include: [{
      model: Enrollment, as: 'enrollment', required: true,
      include: [
        { model: Course, as: 'course', where: courseWhere, attributes: ['id', 'title', 'courseCode'] },
        { model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }] },
        { model: StudentProfile, as: 'student', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
      ],
    }],
    order: [['paymentDate', 'DESC']],
  });
  ResponseFormatter.success(res, receipts);
}));

// POST /api/fee-receipts — record a payment and issue a receipt
router.post('/', AuthMiddleware.requirePermission('LMS.FEE_RECEIPT.CREATE.ALL', 'LMS.FEE_RECEIPT.CREATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { enrollmentId, amountPaid, paymentMethod, paymentDate, session, balanceRemaining, status, notes } = req.body;
  if (!enrollmentId || !amountPaid || !paymentMethod || !paymentDate || !session) {
    return ResponseFormatter.error(res, 'enrollmentId, amountPaid, paymentMethod, paymentDate and session are required', 400);
  }

  const enrollment = await Enrollment.findOne({ where: { ...idOrUuidWhere(enrollmentId) } });
  if (!enrollment) return ResponseFormatter.error(res, 'Enrollment not found', 404);

  const course = await Course.findByPk(enrollment.courseId);
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const scope = getDeptScope(req, 'lms.fee_receipt.create.all');
  if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
    return ResponseFormatter.error(res, 'You can only issue fee receipts for students in your own department', 403);
  }

  // Staff enters what's actually left owing after this payment — a number they
  // already know from the student — rather than an abstract "total course fee"
  // that has to be reverse-engineered and is easy to enter wrong (that
  // confusion is exactly what produced bad data before). The agreed total fee
  // is then derived fresh from cumulative paid + this input every time, so it
  // self-corrects each installment instead of being locked in once and drifting.
  const priorPaid = Number(
    (await FeeReceipt.sum('amountPaid', { where: { enrollmentId: enrollment.id } })) || 0
  );
  const cumulativePaid = priorPaid + Number(amountPaid);
  const balance = Math.max(Number(balanceRemaining) || 0, 0);
  const effectiveTotalFee = cumulativePaid + balance;
  await enrollment.update({ totalFee: effectiveTotalFee } as any);

  const receipt = await FeeReceipt.create({
    uuid: uuidv4(), enrollmentId: enrollment.id, receiptNumber: generateReceiptNumber(),
    amountPaid: Number(amountPaid), paymentMethod, paymentDate, session, balance,
    status: status || (balance <= 0 ? 'Paid' : 'PartPayment'), notes, issuedById: (req as any).user.id,
  } as any);

  ResponseFormatter.success(res, { ...receipt.toJSON(), totalFee: effectiveTotalFee, totalPaid: cumulativePaid }, 'Fee receipt issued', 201);
}));

// GET /api/fee-receipts/:id
router.get('/:id', AuthMiddleware.requirePermission('LMS.FEE_RECEIPT.READ.ALL', 'LMS.FEE_RECEIPT.READ.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const receipt = await FeeReceipt.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
    include: [{
      model: Enrollment, as: 'enrollment',
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title', 'courseCode', 'departmentId'] },
        { model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }] },
        { model: StudentProfile, as: 'student', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
      ],
    }],
  });
  if (!receipt) return ResponseFormatter.error(res, 'Fee receipt not found', 404);

  const scope = getDeptScope(req, 'lms.fee_receipt.read.all');
  if (scope.scoped) {
    const course = (receipt as any).enrollment?.course;
    if (!course || String(course.departmentId) !== String(scope.departmentId)) {
      return ResponseFormatter.error(res, 'You can only view fee receipts for students in your own department', 403);
    }
  }

  ResponseFormatter.success(res, receipt);
}));

// DELETE /api/fee-receipts/:id — remove a receipt and recompute the running
// balance for every remaining receipt on that enrollment, so deleting one
// payment can never leave the others showing a stale balance.
router.delete('/:id', AuthMiddleware.requirePermission('LMS.FEE_RECEIPT.DELETE.ALL', 'LMS.FEE_RECEIPT.DELETE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const receipt = await FeeReceipt.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
    include: [{ model: Enrollment, as: 'enrollment', include: [{ model: Course, as: 'course', attributes: ['id', 'departmentId'] }] }],
  });
  if (!receipt) return ResponseFormatter.error(res, 'Fee receipt not found', 404);

  const scope = getDeptScope(req, 'lms.fee_receipt.delete.all');
  if (scope.scoped) {
    const course = (receipt as any).enrollment?.course;
    if (!course || String(course.departmentId) !== String(scope.departmentId)) {
      return ResponseFormatter.error(res, 'You can only delete fee receipts for students in your own department', 403);
    }
  }

  const enrollment = (receipt as any).enrollment;
  await receipt.destroy();

  const remaining = await FeeReceipt.findAll({ where: { enrollmentId: enrollment.id }, order: [['paymentDate', 'ASC'], ['id', 'ASC']] });
  const totalFee = Number(enrollment.totalFee) || 0;
  let running = 0;
  for (const r of remaining) {
    running += Number(r.amountPaid);
    await r.update({ balance: Math.max(totalFee - running, 0) } as any);
  }

  ResponseFormatter.success(res, null, 'Fee receipt deleted');
}));

export default router;
