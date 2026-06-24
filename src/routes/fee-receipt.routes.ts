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
  const { enrollmentId, amountPaid, paymentMethod, paymentDate, session, term, status, notes } = req.body;
  if (!enrollmentId || !amountPaid || !paymentMethod || !paymentDate || !session || !term) {
    return ResponseFormatter.error(res, 'enrollmentId, amountPaid, paymentMethod, paymentDate, session and term are required', 400);
  }

  const enrollment = await Enrollment.findOne({ where: { ...idOrUuidWhere(enrollmentId) } });
  if (!enrollment) return ResponseFormatter.error(res, 'Enrollment not found', 404);

  const course = await Course.findByPk(enrollment.courseId);
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const scope = getDeptScope(req, 'lms.fee_receipt.create.all');
  if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
    return ResponseFormatter.error(res, 'You can only issue fee receipts for students in your own department', 403);
  }

  const receipt = await FeeReceipt.create({
    uuid: uuidv4(), enrollmentId: enrollment.id, receiptNumber: generateReceiptNumber(),
    amountPaid: Number(amountPaid), paymentMethod, paymentDate, session, term,
    status: status || 'Paid', notes, issuedById: (req as any).user.id,
  } as any);

  ResponseFormatter.success(res, receipt, 'Fee receipt issued', 201);
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

export default router;
