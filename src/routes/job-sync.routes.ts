import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { JobPosting } from '@models/JobPosting.model';
import { JobSyncLog } from '@models/JobSyncLog.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import JobSyncService from '@services/JobSyncService';

const router = Router();

// GET /api/job-sync/stats
router.get('/stats', AuthMiddleware.requirePermission('rec.posting.read.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const [total, synced, pending, failed] = await Promise.all([
    JobPosting.count({ where: { businessUnit: { [Op.ne]: null } } as any }),
    JobPosting.count({ where: { syncStatus: 'Synced' } }),
    JobPosting.count({ where: { syncStatus: 'Pending', businessUnit: { [Op.ne]: null } } as any }),
    JobPosting.count({ where: { syncStatus: 'Failed' } }),
  ]);
  ResponseFormatter.success(res, { total, synced, pending, failed });
}));

// GET /api/job-sync
router.get('/', AuthMiddleware.requirePermission('rec.posting.read.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, syncStatus, businessUnit } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = { businessUnit: { [Op.ne]: null } };
  if (syncStatus) where.syncStatus = syncStatus;
  if (businessUnit) where.businessUnit = businessUnit;

  const { count, rows } = await JobPosting.findAndCountAll({
    where,
    attributes: ['id', 'uuid', 'jobCode', 'title', 'status', 'businessUnit', 'syncStatus', 'externalJobId',
      'syncAttempts', 'lastSyncedAt', 'lastSyncError', 'createdAt'],
    order: [['updatedAt', 'DESC']],
    limit: Number(limit), offset,
  });

  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// PATCH /api/job-sync/:id/retry
router.patch('/:id/retry', AuthMiddleware.requirePermission('rec.posting.update.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const posting = await JobPosting.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!posting) return ResponseFormatter.error(res, 'Job posting not found', 404);
  if (!posting.businessUnit) return ResponseFormatter.error(res, 'This posting has no business unit assigned', 400);

  await JobSyncService.retryOne(posting.id);
  await posting.reload();
  ResponseFormatter.success(res, posting, 'Retry attempted');
}));

// GET /api/job-sync/:id/logs
router.get('/:id/logs', AuthMiddleware.requirePermission('rec.posting.read.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const posting = await JobPosting.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!posting) return ResponseFormatter.error(res, 'Job posting not found', 404);

  const logs = await JobSyncLog.findAll({
    where: { jobPostingId: posting.id },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  ResponseFormatter.success(res, logs);
}));

export default router;
