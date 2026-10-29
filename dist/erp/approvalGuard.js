"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalGuardRouter = approvalGuardRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
const RoleBucket_1 = require("../utils/RoleBucket");
const one = async (sql, id) => {
    if (!/^\d+$/.test(id)) {
        sql = sql.replace(/WHERE (\w+\.)?id = :id/, (_m, p) => `WHERE ${p || ''}uuid::text = :id`);
    }
    try {
        const rows = await Database_1.default.query(sql, { replacements: { id }, type: sequelize_1.QueryTypes.SELECT });
        const v = rows[0] && Object.values(rows[0])[0];
        return v ? Number(v) : null;
    }
    catch {
        return null;
    }
};
const viaStaff = (table) => (id) => one(`SELECT s."userId" FROM ${table} t JOIN staff s ON s.id = t."staffId" WHERE t.id = :id`, id);
const leaveOwner = viaStaff('leave_requests');
const GUARDS = [
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
function approvalGuardRouter() {
    const r = (0, express_1.Router)();
    for (const g of GUARDS) {
        for (const m of g.methods) {
            r[m](g.path, async (req, res, next) => {
                try {
                    if ((0, RoleBucket_1.getRoleBucket)(req) === 'superadmin')
                        return next();
                    if (g.when && !g.when(req))
                        return next();
                    const owner = await g.resolve(req.params.id, req);
                    if (owner && owner === Number(req.user?.id)) {
                        return res.status(403).json({
                            success: false,
                            message: `You cannot approve or reject your own ${g.what}. Another approver (or Super Admin) must do it.`,
                            error: { code: 'SELF_APPROVAL_NOT_ALLOWED' },
                        });
                    }
                    next();
                }
                catch {
                    next();
                }
            });
        }
    }
    return r;
}
//# sourceMappingURL=approvalGuard.js.map