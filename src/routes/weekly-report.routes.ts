import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WeeklyReport } from '@models/WeeklyReport.model';
import { Staff } from '@models/Staff.model';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { getRoleBucket } from '@utils/RoleBucket';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

/**
 * Reporting week's Friday. Weekly reports are submitted on Monday morning for
 * the week that just ended, so this is the most recent Friday on or before
 * today (today if it's Friday). Must match getThisFriday() in the frontend.
 */
function getThisFridayISO(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: process.env.ERP_TIMEZONE || 'Africa/Lagos' }));
  const back = (now.getDay() - 5 + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() - back);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${friday.getFullYear()}-${p(friday.getMonth() + 1)}-${p(friday.getDate())}`;
}

async function getStaffId(req: Request): Promise<bigint | null> {
  const staff = await Staff.findOne({ where: { userId: (req as any).user.id }, attributes: ['id'] });
  return staff ? (staff as any).id : null;
}

// GET /api/hr/weekly-reports/current
router.get('/current', AuthMiddleware.requirePermission('hr.weeklyreport.read.own'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const staffId = await getStaffId(req);
  if (!staffId) return ResponseFormatter.notFound(res, 'No staff profile linked to this account');

  const report = await WeeklyReport.findOne({ where: { staffId, weekEnding: getThisFridayISO() } });
  if (!report) return ResponseFormatter.notFound(res, 'No report for this week yet');
  ResponseFormatter.success(res, report);
}));

// GET /api/hr/weekly-reports — Super Admin and Admin see everyone's reports
// (the only two roles weekly reports are routed to for oversight); everyone
// else (HR/HOD/Staff, including Admin's own submission) only ever sees their own.
router.get('/', AuthMiddleware.requirePermission('hr.weeklyreport.read.own'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const where: any = {};
  const bucket = getRoleBucket(req);
  if (bucket !== 'superadmin' && bucket !== 'admin') {
    const staffId = await getStaffId(req);
    if (!staffId) return ResponseFormatter.success(res, []);
    where.staffId = staffId;
  }

  const reports = await WeeklyReport.findAll({
    where,
    include: [{ model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['weekEnding', 'DESC']],
    limit: 50,
  });

  const mapped = reports.map((r: any) => ({
    id: r.id,
    weekEnding: r.weekEnding,
    status: 'Submitted',
    summary: r.accomplishments,
    challenges: r.challenges,
    nextWeekPlans: r.nextWeekPlans,
    hoursWorked: r.hoursWorked,
    hasBlocker: r.hasBlocker,
    blockerNotes: r.blockerNotes,
    taskStatus: r.taskStatus,
    attachments: r.attachments,
    submittedAt: r.createdAt,
    approvalStatus: r.approvalStatus,
    approvedBy: r.approvedById ? `User #${r.approvedById}` : undefined,
    rejectionReason: r.rejectionReason,
    comments: r.comments,
    staffName: r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : undefined,
  }));

  ResponseFormatter.success(res, mapped);
}));

// POST /api/hr/weekly-reports
router.post('/', AuthMiddleware.requirePermission('hr.weeklyreport.create.own'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const staffId = await getStaffId(req);
  if (!staffId) return ResponseFormatter.error(res, 'No staff profile linked to this account', 400);

  const { weekEnding, accomplishments, challenges, nextWeekPlans, hoursWorked, hasBlocker, blockerNotes, taskStatus, attachments } = req.body;
  if (!accomplishments || !challenges || !nextWeekPlans) {
    return ResponseFormatter.error(res, 'accomplishments, challenges, nextWeekPlans are required', 400);
  }

  const effectiveWeekEnding = weekEnding || getThisFridayISO();

  const existing = await WeeklyReport.findOne({ where: { staffId, weekEnding: effectiveWeekEnding } });
  if (existing) return ResponseFormatter.conflict(res, 'You already submitted a report for this week');

  const report = await WeeklyReport.create({
    uuid: uuidv4(), staffId, weekEnding: effectiveWeekEnding,
    accomplishments, challenges, nextWeekPlans,
    hoursWorked: hoursWorked ? Number(hoursWorked) : undefined,
    hasBlocker: !!hasBlocker, blockerNotes, taskStatus, attachments,
  } as any);

  ResponseFormatter.success(res, report, 'Weekly report submitted', 201);
}));

// PATCH /api/hr/weekly-reports/:id/approve
router.patch('/:id/approve', AuthMiddleware.requireRole('superadmin', 'admin', 'headofadmin'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const report = await WeeklyReport.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!report) return ResponseFormatter.notFound(res, 'Weekly report not found');

  await report.update({
    approvalStatus: 'Approved', approvedById: (req as any).user.id, approvedDate: new Date(), rejectionReason: null,
  } as any);
  ResponseFormatter.success(res, report, 'Weekly report approved');
}));

// PATCH /api/hr/weekly-reports/:id/comment — feedback only, never touches the report content or approval status
router.patch('/:id/comment', AuthMiddleware.requireRole('superadmin', 'admin', 'headofadmin'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const report = await WeeklyReport.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!report) return ResponseFormatter.notFound(res, 'Weekly report not found');

  const { comments } = req.body;
  await report.update({ comments } as any);
  ResponseFormatter.success(res, report, 'Comment saved');
}));

// PATCH /api/hr/weekly-reports/:id/reject
router.patch('/:id/reject', AuthMiddleware.requireRole('superadmin', 'admin', 'headofadmin'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const report = await WeeklyReport.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!report) return ResponseFormatter.notFound(res, 'Weekly report not found');

  const { rejectionReason } = req.body;
  await report.update({
    approvalStatus: 'Rejected', approvedById: (req as any).user.id, approvedDate: new Date(), rejectionReason,
  } as any);
  ResponseFormatter.success(res, report, 'Weekly report rejected');
}));

// DELETE /api/hr/weekly-reports/:id — the author can delete a report that
// has not been approved; management can delete any.
router.delete('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const report: any = await WeeklyReport.findOne({ where: idOrUuidWhere(req.params.id) as any });
  if (!report) return ResponseFormatter.notFound(res, 'Report not found');
  const bucket = getRoleBucket(req);
  const mine = String(report.staffId) === String(await getStaffId(req));
  if (!['superadmin', 'admin'].includes(bucket) && !(mine && report.status !== 'Approved')) {
    return ResponseFormatter.forbidden(res, 'You can only delete your own reports that have not been approved', req.path);
  }
  await report.destroy();
  const { audit } = require('../erp/helpers');
  await audit(req, 'Reports', 'Delete', 'WeeklyReport', report.id, `Deleted weekly report for week ending ${report.weekEnding}`);
  ResponseFormatter.success(res, { id: report.id }, 'Report deleted');
}));

export default router;
