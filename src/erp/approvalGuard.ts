import { Router, Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '@config/Database';
import { getRoleBucket } from '@utils/RoleBucket';

/**
 * Nobody except Super Admin (CEO / developer) may approve or reject their own
 * request — Admin has full access otherwise, but not over their own leave,
 * overtime, weekly report, salary, promotion, appraisal, resignation, or a
 * job posting / training programme they created themselves.
 *
 * Mounted on the API router BEFORE the existing module routers; it only
 * looks up who the request belongs to and either calls next() or returns 403,
 * so no existing route handler had to change.
 */

type Resolver = (id: string, req: Request) => Promise<number | null>;

const one = async (sql: string, id: string): Promise<number | null> => {
  if (!/^\d+$/.test(id)) {
    // Some routes accept a uuid instead of a numeric id.
    sql = sql.replace(/WHERE (\w+\.)?id = :id/, (_m, p) => `WHERE ${p || ''}uuid::text = :id`);
  }
  try {
    const rows: any[] = await sequelize.query(sql, { replacements: { id }, type: QueryTypes.SELECT });
    const v = rows[0] && Object.values(rows[0])[0];
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};

const viaStaff = (table: string): Resolver => (id) =>
  one(`SELECT s."userId" FROM ${table} t JOIN staff s ON s.id = t."staffId" WHERE t.id = :id`, id);

const leaveOwner = viaStaff('leave_requests');

const GUARDS: { methods: string[]; path: string; resolve: Resolver; when?: (req: Request) => boolean; what: string }[] = [
  { methods: ['patch', 'put', 'post'], path: '/leave/requests/:id/approve', resolve: leaveOwner, what: 'leave request' },
  { methods: ['patch', 'put', 'post'], path: '/leave/requests/:id/reject', resolve: leaveOwner, what: 'leave request' },
  { methods: ['post', 'patch', 'put'], path: '/dashboards/head-of-admin/leave-approvals/:id/approve', resolve: leaveOwner, what: 'leave request' },
  { methods: ['put', 'patch', 'post'], path: '/attendance/overtime/:id/approve', resolve: viaStaff('overtime'), what: 'overtime request' },
  { methods: ['put', 'patch', 'post'], path: '/attendance/overtime/:id/reject', resolve: viaStaff('overtime'), what: 'overtime request' },
  { methods: ['patch', 'put', 'post'], path: '/hr/weekly-reports/:id/approve', resolve: viaStaff('weekly_reports'), what: 'weekly report' },
  { methods: ['patch', 'put', 'post'], path: '/hr/weekly-reports/:id/reject', resolve: viaStaff('weekly_reports'), what: 'weekly report' },
  { methods: ['put', 'patch', 'post'], path: '/hr/resignation/:id/approve', resolve: viaStaff('resignations'), what: 'resignation' },
  { methods: ['put', 'patch', 'post'], path: '/hr/promotion/:id/approve', resolve: viaStaff('employee_promotion'), what: 'promotion' },
  { methods: ['put', 'patch', 'post'], path: '/promotions/:id/approve', resolve: viaStaff('employee_promotion'), what: 'promotion' },
  { methods: ['put', 'patch', 'post'], path: '/promotions/:id/reject', resolve: viaStaff('employee_promotion'), what: 'promotion' },
  {
    methods: ['patch', 'put'], path: '/appraisals/:id/status', resolve: viaStaff('appraisals'), what: 'appraisal',
    when: (req) => ['Approved', 'Rejected', 'Completed'].includes(String(req.body?.status)),
  },
  {
    methods: ['patch', 'put'], path: '/payroll/salaries/:id/status', resolve: viaStaff('employee_salaries'), what: 'salary record',
    when: (req) => /approv|paid|reject/i.test(String(req.body?.status)),
  },
  {
    methods: ['patch', 'put'], path: '/job-postings/:id/status', what: 'job posting',
    resolve: (id) => one(`SELECT "createdById" FROM job_postings WHERE id = :id`, id),
    when: (req) => ['Open'].includes(String(req.body?.status)),
  },
  {
    methods: ['patch', 'put'], path: '/training/:id/status', what: 'training programme',
    resolve: (id) => one(`SELECT "createdById" FROM training_programs WHERE id = :id`, id),
    when: (req) => /approv|active|reject/i.test(String(req.body?.status)),
  },
  {
    methods: ['patch', 'put', 'post'], path: '/customer-reports/:id/approve', what: 'customer report',
    resolve: (id) => one(`SELECT "createdById" FROM customer_reports WHERE id = :id`, id),
  },
];

export function approvalGuardRouter(): Router {
  const r = Router();
  for (const g of GUARDS) {
    for (const m of g.methods) {
      (r as any)[m](g.path, async (req: Request, res: Response, next: NextFunction) => {
        try {
          if (getRoleBucket(req) === 'superadmin') return next();
          if (g.when && !g.when(req)) return next();
          const owner = await g.resolve(req.params.id, req);
          if (owner && owner === Number((req as any).user?.id)) {
            return res.status(403).json({
              success: false,
              message: `You cannot approve or reject your own ${g.what}. Another approver (or Super Admin) must do it.`,
              error: { code: 'SELF_APPROVAL_NOT_ALLOWED' },
            });
          }
          next();
        } catch {
          next();
        }
      });
    }
  }
  return r;
}
