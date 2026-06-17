import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { JobPosting } from '@models/JobPosting.model';
import { JobApplication } from '@models/JobApplication.model';
import { Department } from '@models/Department.model';
import { Designation } from '@models/Designation.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import JobSyncService from '@services/JobSyncService';

const BUSINESS_UNITS = ['KS', 'VM', 'BM'];

const router = Router();

// GET /api/job-postings
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 12, status, departmentId, jobType, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (jobType) where.jobType = jobType;
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  const { count, rows } = await JobPosting.findAndCountAll({
    where,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name'] },
      { model: Designation, as: 'designation', attributes: ['id', 'name'] },
    ],
    order: [['postedDate', 'DESC']],
    limit: Number(limit), offset,
  });

  const rowsWithCount = await Promise.all(rows.map(async (jp) => {
    const applicationCount = await JobApplication.count({ where: { jobPostingId: (jp as any).id } });
    return { ...jp.toJSON(), applicationCount };
  }));

  ResponseFormatter.paginated(res, rowsWithCount, count, Number(page), Number(limit));
}));

// GET /api/job-postings/stats/overview
router.get('/stats/overview', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const [total, open, closed, filled, onHold, totalApplications] = await Promise.all([
    JobPosting.count(),
    JobPosting.count({ where: { status: 'Open' } }),
    JobPosting.count({ where: { status: 'Closed' } }),
    JobPosting.count({ where: { status: 'Filled' } }),
    JobPosting.count({ where: { status: 'OnHold' } }),
    JobApplication.count(),
  ]);
  ResponseFormatter.success(res, { total, open, closed, filled, onHold, totalApplications });
}));

// GET /api/job-postings/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const posting = await JobPosting.findOne({
    where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name'] },
      { model: Designation, as: 'designation', attributes: ['id', 'name'] },
    ],
  });
  if (!posting) return ResponseFormatter.error(res, 'Job posting not found', 404);

  const [applicationCount, recentApplications] = await Promise.all([
    JobApplication.count({ where: { jobPostingId: (posting as any).id } }),
    JobApplication.findAll({ where: { jobPostingId: (posting as any).id }, order: [['applicationDate', 'DESC']], limit: 5 }),
  ]);

  ResponseFormatter.success(res, { ...posting.toJSON(), applicationCount, recentApplications });
}));

// POST /api/job-postings
router.post('/', AuthMiddleware.requirePermission('rec.posting.create.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { title, departmentId, designationId, noOfPositions, jobType, postedDate, closingDate,
    description, salaryMin, salaryMax, currency, location, requiredExperience, qualifications, skills, benefits,
    businessUnit } = req.body;

  if (!title || !departmentId || !designationId || !noOfPositions || !jobType || !postedDate || !closingDate) {
    return ResponseFormatter.error(res, 'title, departmentId, designationId, noOfPositions, jobType, postedDate, closingDate are required', 400);
  }
  if (!businessUnit || !BUSINESS_UNITS.includes(businessUnit)) {
    return ResponseFormatter.error(res, `businessUnit is required and must be one of: ${BUSINESS_UNITS.join(', ')}`, 400);
  }

  const count = await JobPosting.count();
  const jobCode = `JOB-${String(count + 1).padStart(6, '0')}`;

  const posting = await JobPosting.create({
    uuid: uuidv4(), jobCode, title, departmentId, designationId, noOfPositions, jobType,
    postedDate, closingDate, description, salaryMin, salaryMax, currency: currency || 'NGN',
    location, requiredExperience, qualifications, skills, benefits, businessUnit,
    status: 'Draft', createdById: (req as any).user.id,
  } as any);
  ResponseFormatter.success(res, posting, 'Job posting created', 201);
}));

// PUT /api/job-postings/:id
router.put('/:id', AuthMiddleware.requirePermission('rec.posting.update.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const posting = await JobPosting.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!posting) return ResponseFormatter.error(res, 'Job posting not found', 404);

  const allowed = ['title', 'description', 'noOfPositions', 'jobType', 'salaryMin', 'salaryMax', 'location',
    'requiredExperience', 'qualifications', 'skills', 'benefits', 'closingDate', 'businessUnit'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await posting.update(updates);

  if (posting.externalJobId) {
    JobSyncService.syncUpdate(posting).catch(err => console.error('[JobSync] update failed:', err));
  }

  ResponseFormatter.success(res, posting, 'Job posting updated');
}));

// PATCH /api/job-postings/:id/status
router.patch('/:id/status', AuthMiddleware.requirePermission('rec.posting.update.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const posting = await JobPosting.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!posting) return ResponseFormatter.error(res, 'Job posting not found', 404);

  const { status } = req.body;
  const validTransitions: Record<string, string[]> = {
    Draft: ['Open', 'Cancelled'],
    Open: ['Closed', 'OnHold', 'Filled'],
    OnHold: ['Open', 'Closed'],
    Closed: ['Open'],
    Filled: [],
    Cancelled: [],
  };

  const current = (posting as any).status;
  if (!validTransitions[current]?.includes(status)) {
    return ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
  }

  await posting.update({ status });

  if (posting.businessUnit) {
    if (!posting.externalJobId) {
      JobSyncService.syncCreate(posting).catch(err => console.error('[JobSync] create failed:', err));
    } else {
      JobSyncService.syncUpdate(posting).catch(err => console.error('[JobSync] update failed:', err));
    }
  }

  ResponseFormatter.success(res, posting, 'Status updated');
}));

// DELETE /api/job-postings/:id
router.delete('/:id', AuthMiddleware.requirePermission('rec.posting.delete.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const posting = await JobPosting.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!posting) return ResponseFormatter.error(res, 'Job posting not found', 404);
  if ((posting as any).status !== 'Draft') return ResponseFormatter.error(res, 'Only Draft postings can be deleted', 400);

  if (posting.externalJobId) {
    JobSyncService.syncDelete(posting).catch(err => console.error('[JobSync] delete failed:', err));
  }

  await posting.destroy();
  ResponseFormatter.success(res, null, 'Job posting deleted');
}));

export default router;
