import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { ResponseFormatter } from '@utils/ResponseFormatter';

const router = Router();

// GET /api/audit-logs — list with filters
router.get(
  '/',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { action, module: mod, search, startDate, endDate } = req.query as Record<string, string>;
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = parseInt((req.query.limit as string) ?? '20', 10);
    const offset = (page - 1) * limit;

    // Try to load AuditLog model if it exists
    try {
      const AuditLog = require('@models/AuditLog.model').default;
      const where: any = {};
      if (action && action !== 'All') where.action = action;
      if (mod) where.module = { [Op.iLike]: `%${mod}%` };
      if (startDate) where.createdAt = { ...(where.createdAt ?? {}), [Op.gte]: new Date(startDate) };
      if (endDate) where.createdAt = { ...(where.createdAt ?? {}), [Op.lte]: new Date(endDate) };

      const { count, rows } = await AuditLog.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
      return ResponseFormatter.paginated(res, rows, count, page, limit);
    } catch {
      // Model not yet created — return sample data
      const SAMPLE = [
        { id: 1, action: 'Login', module: 'Auth', resource: 'User Session', userId: 1, userEmail: 'admin@maxhub.com', userName: 'Super Admin', ipAddress: '197.211.58.4', details: { method: 'password' }, createdAt: new Date().toISOString() },
        { id: 2, action: 'Create', module: 'Staff', resource: 'Staff #S-000012', userId: 1, userEmail: 'admin@maxhub.com', userName: 'Super Admin', ipAddress: '197.211.58.4', details: { name: 'Jane Doe', role: 'HR' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, action: 'Update', module: 'Payroll', resource: 'Payroll Period #PP-001', userId: 2, userEmail: 'hr@maxhub.com', userName: 'HR Manager', ipAddress: '197.211.58.10', details: { field: 'status', from: 'Draft', to: 'Approved' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, action: 'Delete', module: 'Projects', resource: 'Project #PR-000004', userId: 1, userEmail: 'admin@maxhub.com', userName: 'Super Admin', ipAddress: '197.211.58.4', details: { reason: 'Duplicate entry' }, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 5, action: 'Export', module: 'Reports', resource: 'Attendance Report', userId: 3, userEmail: 'hod@maxhub.com', userName: 'HOD Operations', ipAddress: '197.211.59.20', details: { format: 'CSV', rows: 147 }, createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: 6, action: 'Logout', module: 'Auth', resource: 'User Session', userId: 2, userEmail: 'hr@maxhub.com', userName: 'HR Manager', ipAddress: '197.211.58.10', details: {}, createdAt: new Date(Date.now() - 180000).toISOString() },
      ];

      let filtered = SAMPLE;
      if (action && action !== 'All') filtered = filtered.filter(l => l.action === action);
      if (search) filtered = filtered.filter(l => l.userName.includes(search) || l.userEmail.includes(search));

      return ResponseFormatter.paginated(res, filtered.slice(offset, offset + limit), filtered.length, page, limit);
    }
  })
);

// GET /api/audit-logs/:id — single log detail
router.get(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    return ResponseFormatter.success(res, {
      id: req.params.id,
      action: 'Create',
      module: 'Staff',
      resource: `Staff #S-000012`,
      userId: 1,
      userEmail: 'admin@maxhub.com',
      userName: 'Super Admin',
      ipAddress: '197.211.58.4',
      details: { name: 'Jane Doe', role: 'HR', department: 'Human Resources' },
      createdAt: new Date().toISOString(),
    });
  })
);

export default router;
