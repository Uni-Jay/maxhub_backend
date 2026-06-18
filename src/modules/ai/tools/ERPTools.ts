import type { Request } from 'express';
import { Op } from 'sequelize';
import type { ChatToolDeclaration } from '../providers/AIProvider.interface';
import { getAttendanceReportData } from '@routes/reports.routes';
import { searchStaff } from '@routes/staff.routes';
import { getPayrollOverview } from '@routes/payroll.routes';
import { getLeaveBalance } from '@routes/leave.routes';
import { getPendingTasksSummary } from '@routes/task.routes';
import { Staff } from '@models/Staff.model';
import { Department } from '@models/Department.model';
import { Attendance } from '@models/Attendance.model';
import { Project } from '@models/Project.model';
import { Invoice } from '@models/Invoice.model';
import { Enrollment } from '@models/Enrollment.model';
import { LeaveRequest } from '@models/LeaveRequest.model';

/**
 * The 5 Phase-1 "insights" features are exposed to the AI chat as Gemini
 * function-calling tools rather than separate UI panels — the model decides
 * which tool(s) a question needs, the tool calls existing, already-permission-
 * shaped query logic (never raw, unscoped DB access), and the result is handed
 * back to Gemini to summarize in natural language.
 *
 * Every handler takes the current request so it can apply the SAME permission
 * gate the equivalent direct route already enforces — never more, never less.
 */

function normaliseRole(r: string): string {
  return r.toLowerCase().replace(/[^a-z]/g, '');
}

function isSuperAdminOrAdmin(req: Request): boolean {
  const roles = (req.user?.roles || []).map(normaliseRole);
  return roles.some((r) => ['superadmin', 'admin', 'headofadmin'].includes(r));
}

/** Mirrors AuthMiddleware.requirePermission's bypass + normalize + check logic, for use outside route middleware. */
function hasPermission(req: Request, permissionCode: string): boolean {
  if (isSuperAdminOrAdmin(req)) return true;
  const normalized = permissionCode.toLowerCase().replace(/_/g, '.');
  const userPerms = new Set((req.user?.permissions || []).map((p: string) => p.toLowerCase()));
  return userPerms.has(normalized);
}

const NOT_AUTHORIZED = "You're not authorized to view this information. Ask an administrator if you believe you should have access.";

export const ERP_TOOL_DECLARATIONS: ChatToolDeclaration[] = [
  {
    name: 'getAttendanceInsights',
    description: 'Get attendance statistics (present/absent/late counts per staff member, monthly trend, department rates) for a given month and year. Use this for questions like "who was absent this week" or "what is our attendance rate".',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'number', description: 'Month number 1-12. Defaults to the current month.' },
        year: { type: 'number', description: 'Four-digit year. Defaults to the current year.' },
      },
    },
  },
  {
    name: 'searchEmployees',
    description: 'Search for employees/staff by name, email, employee ID, department, branch, or status. Use this for questions like "find John in Sales" or "who works in the Lagos branch".',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Free-text search against first name, last name, email, or employee ID.' },
        departmentId: { type: 'number', description: 'Filter by department ID, if known.' },
        status: { type: 'string', description: 'Staff status, e.g. Active, Inactive.' },
      },
    },
  },
  {
    name: 'getPayrollSummary',
    description: 'Get the current payroll overview: headcount, gross/net totals, deductions, year-to-date payroll cost, and status breakdown for the current period. Use this for questions about payroll totals or payroll status.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getLeaveSummary',
    description: "Get the current user's own leave balance: total/used/available days broken down by leave type. Use this for questions like \"how much leave do I have left\".",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getDashboardInsights',
    description: 'Get high-level organizational dashboard metrics (headcount, attendance rate, active projects, revenue, pending approvals). Scope of data depends on the asking user\'s role. Use this for broad "how are we doing" questions.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getMyTasks',
    description: 'Get the asking user\'s pending (not Done/Cancelled) tasks, sorted by due date, including which are overdue or due today. For a Staff member this is their own assigned tasks plus any personal tasks they created; for a Head of Department it is their department\'s pending tasks; for HR/Admin/Super Admin it is company-wide. Use this for questions like "summarize today\'s pending tasks", "what tasks do I have", "what is overdue", or "what is my team working on".',
    parameters: { type: 'object', properties: {} },
  },
];

async function handleGetAttendanceInsights(req: Request, args: Record<string, unknown>): Promise<string> {
  const now = new Date();
  const month = Math.min(12, Math.max(1, Number(args.month) || now.getMonth() + 1));
  const year = Number(args.year) || now.getFullYear();
  const data = await getAttendanceReportData(month, year);
  return JSON.stringify(data);
}

async function handleSearchEmployees(req: Request, args: Record<string, unknown>): Promise<string> {
  const { count, rows } = await searchStaff({
    search: args.search as string | undefined,
    departmentId: args.departmentId as number | undefined,
    status: args.status as string | undefined,
    limit: 10,
  });
  return JSON.stringify({
    total: count,
    employees: rows.map((r: any) => ({
      name: `${r.firstName} ${r.lastName}`,
      employeeId: r.employeeId,
      email: r.email,
      department: r.department?.name,
      designation: r.designation?.name,
      status: r.status,
    })),
  });
}

async function handleGetPayrollSummary(req: Request): Promise<string> {
  if (!hasPermission(req, 'PAYROLL_VIEW')) return NOT_AUTHORIZED;
  const data = await getPayrollOverview();
  return JSON.stringify(data);
}

async function handleGetLeaveSummary(req: Request): Promise<string> {
  const data = await getLeaveBalance((req.user as any)?.staffId as number | undefined);
  return JSON.stringify(data);
}

/**
 * Mirrors DashboardController's getSuperAdminStats / getHeadOfAdminStats query
 * shape (same models, same filters) — not imported directly since those are
 * Express handlers that write to `res` rather than return data, and that
 * controller file is `// @ts-nocheck`.
 */
async function handleGetDashboardInsights(req: Request): Promise<string> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  if (isSuperAdminOrAdmin(req)) {
    const [totalEmployees, totalDepartments, todayPresent, todayTotal, activeProjects, totalStudents, revenueResult, pendingApprovals] =
      await Promise.all([
        Staff.count({ where: { status: 'Active' } }),
        Department.count(),
        Attendance.count({ where: { attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: { [Op.in]: ['Present', 'Late'] } } }),
        Attendance.count({ where: { attendanceDate: { [Op.between]: [startOfDay, endOfDay] } } }),
        Project.count({ where: { status: 'Active' } }),
        Enrollment.count({ where: { status: { [Op.in]: ['Enrolled', 'InProgress'] } } }),
        Invoice.sum('total', { where: { status: 'Paid' } }),
        LeaveRequest.count({ where: { status: 'Pending' } }),
      ]);
    return JSON.stringify({
      scope: 'organization-wide',
      totalEmployees,
      totalDepartments,
      attendanceRate: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0,
      activeProjects,
      totalStudents,
      totalRevenue: revenueResult ?? 0,
      pendingApprovals,
    });
  }

  const [totalStaff, pendingApprovals, todayPresent, todayTotal, activeProjects] = await Promise.all([
    Staff.count({ where: { status: 'Active' } }),
    LeaveRequest.count({ where: { status: 'Pending' } }),
    Attendance.count({ where: { attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: { [Op.in]: ['Present', 'Late'] } } }),
    Attendance.count({ where: { attendanceDate: { [Op.between]: [startOfDay, endOfDay] } } }),
    Project.count({ where: { status: 'Active' } }),
  ]);
  return JSON.stringify({
    scope: 'department',
    totalStaff,
    pendingApprovals,
    averageAttendance: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0,
    activeProjects,
  });
}

async function handleGetMyTasks(req: Request): Promise<string> {
  const data = await getPendingTasksSummary(req);
  return JSON.stringify(data);
}

export function createToolExecutor(req: Request): (name: string, args: Record<string, unknown>) => Promise<string> {
  return async (name, args) => {
    try {
      switch (name) {
        case 'getAttendanceInsights': return await handleGetAttendanceInsights(req, args);
        case 'searchEmployees': return await handleSearchEmployees(req, args);
        case 'getPayrollSummary': return await handleGetPayrollSummary(req);
        case 'getLeaveSummary': return await handleGetLeaveSummary(req);
        case 'getDashboardInsights': return await handleGetDashboardInsights(req);
        case 'getMyTasks': return await handleGetMyTasks(req);
        default: return `Unknown tool: ${name}`;
      }
    } catch (err: any) {
      return `Error retrieving this data: ${err.message}`;
    }
  };
}
