import { Router, Request, Response } from 'express';
import { CustomerReport } from '@models/CustomerReport.model';
import { Staff } from '@models/Staff.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

function isManagerRole(req: Request): boolean {
  const roles = ((req as any).user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  return ['superadmin', 'admin', 'headofadmin', 'hr', 'hod'].some((r) => roles.includes(r));
}

function isCeoRole(req: Request): boolean {
  const roles = ((req as any).user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  return roles.includes('superadmin');
}

/**
 * Mirrors the frontend's own canSee logic (CustomerReportList.tsx) — a CEO
 * sees every business unit; everyone else only sees reports in their own
 * unit or any additional unit they cover. Resolved server-side too since
 * relying on the client to filter would let anyone query the API directly
 * and see every unit's client financials.
 */
async function getUnitScope(req: Request): Promise<{ scoped: boolean; units: string[] }> {
  if (isCeoRole(req)) return { scoped: false, units: [] };
  const staff = await Staff.findOne({ where: { userId: (req as any).user.id }, attributes: ['businessUnit', 'businessUnits'] });
  const units = new Set<string>();
  if ((staff as any)?.businessUnit) units.add((staff as any).businessUnit);
  for (const u of (staff as any)?.businessUnits || []) units.add(u);
  return { scoped: true, units: [...units] };
}

// GET /api/customer-reports
router.get('/', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.approvalStatus = status;

  const scope = await getUnitScope(req);
  if (scope.scoped) {
    if (!scope.units.length) return ResponseFormatter.success(res, []);
    (where as any).businessUnit = scope.units;
  }

  const reports = await CustomerReport.findAll({ where, order: [['createdAt', 'DESC']] });
  ResponseFormatter.success(res, reports);
}));

// POST /api/customer-reports
router.post('/', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const {
    clientName, clientPhone, clientEmail, assignedStaff, servicePurchased, department, businessUnit,
    currentStatus, pendingActions, completedActions, totalAmount, amountPaid, outstandingBalance,
    attachments, approvalStatus, submittedBy, noteText,
  } = req.body;

  if (!clientName || !servicePurchased || !businessUnit) {
    return ResponseFormatter.error(res, 'clientName, servicePurchased and businessUnit are required', 400);
  }

  const notes = noteText ? [{ date: new Date().toISOString().slice(0, 10), text: noteText, author: submittedBy || user.email }] : [];

  const report = await CustomerReport.create({
    clientName, clientPhone, clientEmail, assignedStaff, servicePurchased, department, businessUnit,
    currentStatus, pendingActions, completedActions,
    totalAmount: totalAmount || 0, amountPaid: amountPaid || 0, outstandingBalance: outstandingBalance || 0,
    attachments: attachments || [],
    notes,
    approvalStatus: approvalStatus === 'Submitted' ? 'Submitted' : 'Draft',
    submittedBy: approvalStatus === 'Submitted' ? (submittedBy || user.email) : undefined,
    submittedAt: approvalStatus === 'Submitted' ? new Date() : undefined,
    createdById: user.id,
  } as any);

  ResponseFormatter.success(res, report, 'Customer report created', 201);
}));

// PATCH /api/customer-reports/:id — edit details (the "Edit Report" flow)
router.patch('/:id', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const report = await CustomerReport.findByPk(req.params.id);
  if (!report) return ResponseFormatter.notFound(res, 'Customer report not found');

  const {
    clientName, clientPhone, clientEmail, assignedStaff, servicePurchased, department, businessUnit,
    currentStatus, pendingActions, completedActions, totalAmount, amountPaid, outstandingBalance,
    attachments, noteText, approvalStatus,
  } = req.body;

  const updates: Record<string, unknown> = {
    clientName, clientPhone, clientEmail, assignedStaff, servicePurchased, department, businessUnit,
    currentStatus, pendingActions, completedActions, totalAmount, amountPaid, outstandingBalance, attachments,
  };
  for (const k of Object.keys(updates)) if (updates[k] === undefined) delete updates[k];

  const user = (req as any).user;
  if (noteText) {
    const existingNotes = (report as any).notes || [];
    updates.notes = [...existingNotes, { date: new Date().toISOString().slice(0, 10), text: noteText, author: user.email }];
  }

  // The edit form's "Submit for Review" button saves field changes and
  // submits in one action — only the Draft -> Submitted leg is allowed
  // here; approve/reject/revision still require the dedicated routes
  // (manager-role gated) below.
  if (approvalStatus === 'Submitted' && (report as any).approvalStatus === 'Draft') {
    updates.approvalStatus = 'Submitted';
    updates.submittedBy = user.email;
    updates.submittedAt = new Date();
  }

  await report.update(updates);
  ResponseFormatter.success(res, report, 'Customer report updated');
}));

// PATCH /api/customer-reports/:id/submit — Draft -> Submitted
router.patch('/:id/submit', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const report = await CustomerReport.findByPk(req.params.id);
  if (!report) return ResponseFormatter.notFound(res, 'Customer report not found');
  if ((report as any).approvalStatus !== 'Draft') {
    return ResponseFormatter.error(res, 'Only draft reports can be submitted', 400);
  }
  await report.update({ approvalStatus: 'Submitted', submittedBy: user.email, submittedAt: new Date() } as any);
  ResponseFormatter.success(res, report, 'Report submitted for review');
}));

// PATCH /api/customer-reports/:id/approve
router.patch('/:id/approve', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  if (!isManagerRole(req)) return ResponseFormatter.forbidden(res, 'Only managers can approve customer reports', req.path);
  const user = (req as any).user;
  const report = await CustomerReport.findByPk(req.params.id);
  if (!report) return ResponseFormatter.notFound(res, 'Customer report not found');
  await report.update({ approvalStatus: 'Approved', approvedBy: user.email, approvedAt: new Date() } as any);
  ResponseFormatter.success(res, report, 'Report approved');
}));

// PATCH /api/customer-reports/:id/reject
router.patch('/:id/reject', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  if (!isManagerRole(req)) return ResponseFormatter.forbidden(res, 'Only managers can reject customer reports', req.path);
  const report = await CustomerReport.findByPk(req.params.id);
  if (!report) return ResponseFormatter.notFound(res, 'Customer report not found');
  await report.update({ approvalStatus: 'Rejected', rejectionReason: req.body.reason } as any);
  ResponseFormatter.success(res, report, 'Report rejected');
}));

// PATCH /api/customer-reports/:id/revision — request changes
router.patch('/:id/revision', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  if (!isManagerRole(req)) return ResponseFormatter.forbidden(res, 'Only managers can request revisions', req.path);
  const report = await CustomerReport.findByPk(req.params.id);
  if (!report) return ResponseFormatter.notFound(res, 'Customer report not found');
  await report.update({ approvalStatus: 'Revision Requested', revisionNote: req.body.reason } as any);
  ResponseFormatter.success(res, report, 'Revision requested');
}));

// PATCH /api/customer-reports/:id/archive
router.patch('/:id/archive', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const report = await CustomerReport.findByPk(req.params.id);
  if (!report) return ResponseFormatter.notFound(res, 'Customer report not found');
  await report.update({ approvalStatus: 'Archived' } as any);
  ResponseFormatter.success(res, report, 'Report archived');
}));

export default router;
