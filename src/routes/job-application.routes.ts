import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { JobApplication } from '@models/JobApplication.model';
import { JobPosting } from '@models/JobPosting.model';
import { Contact } from '@models/Contact.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// GET /api/job-applications
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, jobPostingId, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (jobPostingId) where.jobPostingId = jobPostingId;
  if (search) where[Op.or] = [
    { applicantName: { [Op.like]: `%${search}%` } },
    { applicantEmail: { [Op.like]: `%${search}%` } },
  ];

  const { count, rows } = await JobApplication.findAndCountAll({
    where,
    include: [{ model: JobPosting, as: 'jobPosting', attributes: ['id', 'title', 'jobCode', 'status'] }],
    order: [['applicationDate', 'DESC']],
    limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/job-applications/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const application = await JobApplication.findOne({
    where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    include: [{ model: JobPosting, as: 'jobPosting' }],
  });
  if (!application) return ResponseFormatter.error(res, 'Application not found', 404);
  ResponseFormatter.success(res, application);
}));

// POST /api/job-applications
router.post('/', AuthMiddleware.requirePermission('rec.application.create.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { jobPostingId, applicantName, applicantEmail, applicantPhone, resumeUrl, coverLetterUrl, source, notes, contactId } = req.body;
  if (!jobPostingId || !applicantName || !applicantEmail || !applicantPhone) {
    return ResponseFormatter.error(res, 'jobPostingId, applicantName, applicantEmail, applicantPhone are required', 400);
  }

  const posting = await JobPosting.findByPk(jobPostingId);
  if (!posting) return ResponseFormatter.error(res, 'Job posting not found', 404);
  if ((posting as any).status !== 'Open') return ResponseFormatter.error(res, 'Job posting is not open for applications', 400);

  const existing = await JobApplication.findOne({ where: { jobPostingId, applicantEmail } });
  if (existing) return ResponseFormatter.error(res, 'Applicant has already applied for this position', 409);

  const application = await JobApplication.create({
    uuid: uuidv4(), jobPostingId, contactId,
    applicantName, applicantEmail, applicantPhone,
    resumeUrl, coverLetterUrl, source, notes,
    applicationDate: new Date(), status: 'Applied',
  } as any);
  ResponseFormatter.success(res, application, 'Application submitted', 201);
}));

// PUT /api/job-applications/:id
router.put('/:id', AuthMiddleware.requirePermission('rec.application.update.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const application = await JobApplication.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!application) return ResponseFormatter.error(res, 'Application not found', 404);

  const allowed = ['applicantName', 'applicantPhone', 'resumeUrl', 'coverLetterUrl', 'source', 'notes'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await application.update(updates);
  ResponseFormatter.success(res, application, 'Application updated');
}));

// PATCH /api/job-applications/:id/status
router.patch('/:id/status', AuthMiddleware.requirePermission('rec.application.update.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const application = await JobApplication.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!application) return ResponseFormatter.error(res, 'Application not found', 404);

  const { status, notes } = req.body;
  const current = (application as any).status;
  const validTransitions: Record<string, string[]> = {
    Applied: ['Shortlisted', 'Rejected'],
    Shortlisted: ['Interviewed', 'Rejected'],
    Interviewed: ['Offered', 'Rejected'],
    Offered: ['Withdrawn'],
    Rejected: [],
    Withdrawn: [],
  };

  if (!validTransitions[current]?.includes(status)) {
    return ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
  }

  await application.update({ status, notes: notes || (application as any).notes });
  ResponseFormatter.success(res, application, 'Status updated');
}));

// DELETE /api/job-applications/:id
router.delete('/:id', AuthMiddleware.requirePermission('rec.application.delete.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const application = await JobApplication.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!application) return ResponseFormatter.error(res, 'Application not found', 404);
  await application.destroy();
  ResponseFormatter.success(res, null, 'Application deleted');
}));

export default router;
