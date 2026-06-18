import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Appraisal } from '@models/Appraisal.model';
import { Staff } from '@models/Staff.model';
import { User } from '@models/User.model';
import { Goal } from '@models/Goal.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { isSuperAdmin } from '@utils/isSuperAdmin';

const router = Router();

// GET /api/appraisals
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, staffId, appraisalPeriod } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (staffId) where.staffId = staffId;
  if (appraisalPeriod) where.appraisalPeriod = appraisalPeriod;

  const { count, rows } = await Appraisal.findAndCountAll({
    where,
    include: [{ model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName', 'avatar', 'email'] }] }],
    order: [['appraisalDate', 'DESC']],
    limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/appraisals/stats/overview
router.get('/stats/overview', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const [total, pending, completed] = await Promise.all([
    Appraisal.count(),
    Appraisal.count({ where: { status: { [Op.in]: ['Draft', 'InProgress'] } } }),
    Appraisal.count({ where: { status: { [Op.in]: ['Completed', 'Approved'] } } }),
  ]);

  const ratings = await Appraisal.findAll({ attributes: ['overallRating'] });
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum: number, a: any) => sum + Number(a.overallRating), 0) / ratings.length
    : 0;

  ResponseFormatter.success(res, { total, pending, completed, avgRating: Number(avgRating.toFixed(2)) });
}));

// GET /api/appraisals/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const appraisal = await Appraisal.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
    include: [{ model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName', 'avatar'] }] }],
  });
  if (!appraisal) return ResponseFormatter.error(res, 'Appraisal not found', 404);

  const goals = await Goal.findAll({ where: { staffId: (appraisal as any).staffId }, order: [['dueDate', 'ASC']] });
  ResponseFormatter.success(res, { ...appraisal.toJSON(), goals });
}));

// POST /api/appraisals
router.post('/', AuthMiddleware.requirePermission('HR.APPRAISAL.CREATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { staffId, appraisalPeriod, appraisalDate, reviewerUserId, overallRating, performanceNotes, strengths, improvements } = req.body;
  if (!staffId || !appraisalPeriod || !appraisalDate || !reviewerUserId || overallRating === undefined) {
    return ResponseFormatter.error(res, 'staffId, appraisalPeriod, appraisalDate, reviewerUserId, overallRating are required', 400);
  }

  if (overallRating < 1 || overallRating > 5) {
    return ResponseFormatter.error(res, 'overallRating must be between 1 and 5', 400);
  }

  const count = await Appraisal.count();
  const appraisalCode = `APR-${String(count + 1).padStart(6, '0')}`;

  const appraisal = await Appraisal.create({
    uuid: uuidv4(), appraisalCode, staffId, appraisalPeriod, appraisalDate,
    reviewerUserId, overallRating, performanceNotes, strengths, improvements,
    status: 'Draft',
  } as any);
  ResponseFormatter.success(res, appraisal, 'Appraisal created', 201);
}));

// PUT /api/appraisals/:id
router.put('/:id', AuthMiddleware.requirePermission('HR.APPRAISAL.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const appraisal = await Appraisal.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!appraisal) return ResponseFormatter.error(res, 'Appraisal not found', 404);
  if (!['Draft', 'InProgress'].includes((appraisal as any).status)) {
    return ResponseFormatter.error(res, 'Only Draft or InProgress appraisals can be edited', 400);
  }

  const allowed = ['appraisalPeriod', 'appraisalDate', 'overallRating', 'performanceNotes', 'strengths', 'improvements'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await appraisal.update(updates);
  ResponseFormatter.success(res, appraisal, 'Appraisal updated');
}));

// PATCH /api/appraisals/:id/status
router.patch('/:id/status', AuthMiddleware.requirePermission('HR.APPRAISAL.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const appraisal = await Appraisal.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!appraisal) return ResponseFormatter.error(res, 'Appraisal not found', 404);

  const { status } = req.body;
  const current = (appraisal as any).status;
  const validTransitions: Record<string, string[]> = {
    Draft: ['InProgress'],
    InProgress: ['Completed'],
    Completed: ['Approved', 'Rejected'],
    Approved: [],
    Rejected: ['Draft'],
  };

  if (!validTransitions[current]?.includes(status)) {
    return ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
  }

  if ((status === 'Approved' || status === 'Rejected') && !isSuperAdmin(req)) {
    return ResponseFormatter.forbidden(res, 'Only Super Admin can approve or reject an appraisal', req.path);
  }

  const updates: any = { status };
  if (status === 'Completed') updates.completedDate = new Date();
  if (status === 'Approved') { updates.approvedBy = (req as any).user.id; updates.approvedDate = new Date(); }

  await appraisal.update(updates);
  ResponseFormatter.success(res, appraisal, 'Appraisal status updated');
}));

// DELETE /api/appraisals/:id
router.delete('/:id', AuthMiddleware.requirePermission('HR.APPRAISAL.DELETE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const appraisal = await Appraisal.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!appraisal) return ResponseFormatter.error(res, 'Appraisal not found', 404);
  await appraisal.destroy();
  ResponseFormatter.success(res, null, 'Appraisal deleted');
}));

export default router;
