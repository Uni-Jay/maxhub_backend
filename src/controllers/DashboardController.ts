// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { PermissionCode } from '@config/PermissionCodes';
import { Staff } from '@models/Staff.model';
import { Department } from '@models/Department.model';
import { StaffDepartment } from '@models/StaffDepartment.model';
import { Attendance } from '@models/Attendance.model';
import { Project } from '@models/Project.model';
import { Invoice } from '@models/Invoice.model';
import { LeaveRequest } from '@models/LeaveRequest.model';
import { Enrollment } from '@models/Enrollment.model';
import { Contact } from '@models/Contact.model';
import { Opportunity } from '@models/Opportunity.model';
import { LeaveType } from '@models/LeaveType.model';
import { WeeklyReport } from '@models/WeeklyReport.model';
import { EmployeePromotion } from '@models/EmployeePromotion.model';
import { JobPosting } from '@models/JobPosting.model';
import { JobApplication } from '@models/JobApplication.model';
import { Task } from '@models/Task.model';
import { PayrollPeriod } from '@models/PayrollPeriod.model';
import { Overtime } from '@models/Overtime.model';
import { Budget } from '@models/Budget.model';
import { Expense } from '@models/Expense.model';
import { Client } from '@models/Client.model';
import { CalendarEvent } from '@models/CalendarEvent.model';
import { StaffQuery } from '@models/StaffQuery.model';
import { ConversationParticipant } from '@models/ConversationParticipant.model';
import { Message } from '@models/Message.model';
import { MessageRead } from '@models/MessageRead.model';
import { getPayrollOverview } from '@routes/payroll.routes';

interface AuthenticatedRequest extends Request {
  user?: {
    id: bigint;
    uuid: string;
    email: string;
    roles: string[];
    permissions: string[];
    departmentId?: bigint | null;
  };
}

function normaliseRole(r: string): string {
  return r.toLowerCase().replace(/[^a-z]/g, '');
}

function isSuperAdmin(req: AuthenticatedRequest): boolean {
  const SUPER_CODES = new Set(['superadmin', 'admin', 'headofadmin']);
  return !!req.user?.roles?.some((r: string) => SUPER_CODES.has(normaliseRole(r)));
}

function isAuthenticated(req: AuthenticatedRequest): boolean {
  return !!req.user;
}

/** Coarse role bucket used to pick which scope to apply — first matching role wins. */
function getRoleBucket(req: AuthenticatedRequest): 'superadmin' | 'admin' | 'hr' | 'hod' | 'staff' {
  const roles = (req.user?.roles ?? []).map(normaliseRole);
  if (roles.includes('superadmin')) return 'superadmin';
  if (roles.includes('admin') || roles.includes('headofadmin')) return 'admin';
  if (roles.includes('hr')) return 'hr';
  if (roles.includes('hod')) return 'hod';
  return 'staff';
}

/** Looks up the requester's own Staff row (id/department/business unit/position) — same lookup pattern already used in weekly-report.routes.ts's getStaffId(). */
async function getOwnStaff(req: AuthenticatedRequest) {
  if (!req.user?.id) return null;
  return Staff.findOne({ where: { userId: req.user.id }, attributes: ['id', 'departmentId', 'businessUnit', 'position'] });
}

/** Position is not an RBAC role — this just lets a staff member's job title unlock their own position-specific dashboard, same way getStaffStats already self-scopes without a permission gate. */
async function hasPosition(req: AuthenticatedRequest, position: string): Promise<boolean> {
  if (isSuperAdmin(req)) return true;
  const staff = await getOwnStaff(req);
  return !!staff?.position && staff.position.toLowerCase() === position.toLowerCase();
}

function canApproveLeave(req: AuthenticatedRequest): boolean {
  return isSuperAdmin(req) || !!req.user?.permissions.some(p =>
    [PermissionCode.LEAVE_REQUEST_APPROVE_ALL, PermissionCode.LEAVE_REQUEST_APPROVE_OWN_DEPARTMENT].includes(p as any)
  );
}

function canReadLeave(req: AuthenticatedRequest): boolean {
  return isSuperAdmin(req) || !!req.user?.permissions.some(p =>
    [PermissionCode.LEAVE_REQUEST_READ_ALL, PermissionCode.LEAVE_REQUEST_READ_OWN_DEPARTMENT, PermissionCode.LEAVE_REQUEST_READ_OWN].includes(p as any)
  );
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export class DashboardController {
  static getSuperAdminStats = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions to view dashboard');
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const [
        totalEmployees,
        totalDepartments,
        todayAttendance,
        todayTotal,
        activeProjects,
        totalStudents,
        revenueResult,
        pendingApprovals,
      ] = await Promise.all([
        Staff.count({ where: { status: 'Active' } }),
        Department.count(),
        Attendance.count({ where: { attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: { [Op.in]: ['Present', 'Late'] } } }),
        Attendance.count({ where: { attendanceDate: { [Op.between]: [startOfDay, endOfDay] } } }),
        Project.count({ where: { status: 'Active' } }),
        Enrollment.count({ where: { status: { [Op.in]: ['Enrolled', 'InProgress'] } } }),
        Invoice.sum('total', { where: { status: 'Paid' } }),
        LeaveRequest.count({ where: { status: 'Pending' } }),
      ]);

      const attendanceRate = todayTotal > 0 ? Math.round((todayAttendance / todayTotal) * 1000) / 10 : 0;

      ResponseFormatter.success(res, {
        totalEmployees,
        totalDepartments,
        attendanceRate,
        activeProjects,
        totalStudents,
        totalRevenue: revenueResult ?? 0,
        pendingApprovals,
        activePayrolls: totalEmployees,
      }, 'Dashboard statistics retrieved');
    }
  );

  static getSuperAdminAttendance = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const days = parseInt(req.query.days as string) || 7;
      const results: any[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const [present, absent, late] = await Promise.all([
          Attendance.count({ where: { attendanceDate: { [Op.between]: [start, end] }, status: 'Present' } }),
          Attendance.count({ where: { attendanceDate: { [Op.between]: [start, end] }, status: 'Absent' } }),
          Attendance.count({ where: { attendanceDate: { [Op.between]: [start, end] }, status: 'Late' } }),
        ]);

        results.push({
          date: date.toISOString().slice(0, 10),
          present,
          absent,
          late,
        });
      }

      ResponseFormatter.success(res, results, 'Attendance data retrieved');
    }
  );

  static getSuperAdminRevenue = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const monthsBack = parseInt(req.query.months as string) || 6;
      const results: any[] = [];

      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = d.getMonth();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);

        const value = await Invoice.sum('total', {
          where: { status: 'Paid', invoiceDate: { [Op.between]: [start, end] } },
        });

        results.push({ month: MONTH_NAMES[month], revenue: value ?? 0, target: 0 });
      }

      ResponseFormatter.success(res, results, 'Revenue data retrieved');
    }
  );

  static getSuperAdminPayroll = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      // Aggregate from invoices or fallback to zero if no payroll model available
      const totalPaid = await Invoice.sum('total', { where: { status: 'Paid' } }) ?? 0;

      const payrollData = [
        { category: 'Revenue (Paid)', value: totalPaid },
        { category: 'Pending', value: await Invoice.sum('total', { where: { status: 'Issued' } }) ?? 0 },
        { category: 'Overdue', value: await Invoice.sum('total', { where: { status: 'Overdue' } }) ?? 0 },
        { category: 'Cancelled', value: await Invoice.sum('total', { where: { status: 'Cancelled' } }) ?? 0 },
      ];

      ResponseFormatter.success(res, payrollData, 'Payroll data retrieved');
    }
  );

  static getSuperAdminDepartments = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const departments = await Department.findAll({
        attributes: ['id', 'name'],
        include: [
          { model: Staff, as: 'staff', attributes: [], required: false, where: { status: 'Active' } },
        ],
      });

      const result = departments.map((d: any) => ({
        name: d.name,
        value: d.staff?.length ?? 0,
      }));

      ResponseFormatter.success(res, result, 'Department data retrieved');
    }
  );

  static getSuperAdminStudents = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const [totalEnrolled, activeStudents, completedCourses, droppedStudents] = await Promise.all([
        Enrollment.count(),
        Enrollment.count({ where: { status: { [Op.in]: ['Enrolled', 'InProgress'] } } }),
        Enrollment.count({ where: { status: 'Completed' } }),
        Enrollment.count({ where: { status: 'Dropped' } }),
      ]);

      ResponseFormatter.success(res, { totalEnrolled, activeStudents, completedCourses, droppedStudents }, 'Student analytics retrieved');
    }
  );

  static getSuperAdminProjects = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const [active, completed, onHold, cancelled] = await Promise.all([
        Project.count({ where: { status: 'Active' } }),
        Project.count({ where: { status: 'Completed' } }),
        Project.count({ where: { status: 'OnHold' } }),
        Project.count({ where: { status: 'Cancelled' } }),
      ]);

      ResponseFormatter.success(res, [
        { name: 'Active Projects', value: active },
        { name: 'Completed', value: completed },
        { name: 'On Hold', value: onHold },
        { name: 'Cancelled', value: cancelled },
      ], 'Project data retrieved');
    }
  );

  static getSuperAdminCRM = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const [totalLeads, totalOpportunities, convertedDeals, lostDeals] = await Promise.all([
        Contact.count({ where: { status: { [Op.in]: ['Lead', 'Prospect'] } } }),
        Opportunity.count(),
        Opportunity.count({ where: { stage: 'Won' } }),
        Opportunity.count({ where: { stage: 'Lost' } }),
      ]);

      const conversionRate = totalOpportunities > 0
        ? Math.round((convertedDeals / totalOpportunities) * 1000) / 10
        : 0;

      ResponseFormatter.success(res, { totalLeads, totalOpportunities, convertedDeals, lostDeals, conversionRate }, 'CRM metrics retrieved');
    }
  );

  static getSuperAdminNotifications = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isSuperAdmin(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const limit = parseInt(req.query.limit as string) || 5;

      const [pendingLeaves, overdueInvoices] = await Promise.all([
        LeaveRequest.count({ where: { status: 'Pending' } }),
        Invoice.count({ where: { status: 'Overdue' } }),
      ]);

      const now = new Date().toISOString();
      const notifications: any[] = [];
      if (pendingLeaves > 0) {
        notifications.push({ id: 'leave', title: 'Leave Requests', message: `${pendingLeaves} leave request${pendingLeaves !== 1 ? 's' : ''} pending approval`, type: 'warning', read: false, created_at: now });
      }
      if (overdueInvoices > 0) {
        notifications.push({ id: 'invoice', title: 'Overdue Invoices', message: `${overdueInvoices} invoice${overdueInvoices !== 1 ? 's' : ''} are overdue`, type: 'error', read: false, created_at: now });
      }

      ResponseFormatter.success(res, notifications.slice(0, limit), 'Notifications retrieved');
    }
  );

  /**
   * Role-aware approvals queue, shared by Super Admin / Admin / HR / HOD dashboards.
   * Which categories appear, and how each is scoped, depends on the caller's role —
   * the frontend doesn't need to know this; it just renders whatever categories
   * come back. Staff has no approval permissions in RolesConfig.ts and isn't expected
   * to call this at all.
   */
  static getApprovalsQueue = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const bucket = getRoleBucket(req);

      // Resolve the staffId scope for roles that aren't company-wide.
      let staffIds: number[] | null = null; // null = unscoped (superadmin / hr)
      let departmentIds: number[] | null = null;
      if (bucket === 'hod') {
        const departmentId = req.user?.departmentId;
        const deptStaff = await Staff.findAll({ where: departmentId ? { departmentId } : {}, attributes: ['id'] });
        staffIds = deptStaff.map((s: any) => Number(s.id));
        departmentIds = departmentId ? [Number(departmentId)] : [];
      } else if (bucket === 'admin') {
        const ownStaff = await getOwnStaff(req);
        if (ownStaff?.businessUnit) {
          const buStaff = await Staff.findAll({ where: { businessUnit: ownStaff.businessUnit }, attributes: ['id', 'departmentId'] });
          staffIds = buStaff.map((s: any) => Number(s.id));
          departmentIds = [...new Set(buStaff.map((s: any) => s.departmentId).filter(Boolean).map(Number))];
        }
      }
      const staffScope = staffIds ? { staffId: { [Op.in]: staffIds.length ? staffIds : [-1] } } : {};
      const assigneeScope = staffIds ? { assigneeId: { [Op.in]: staffIds.length ? staffIds : [-1] } } : {};
      const deptScope = departmentIds ? { departmentId: { [Op.in]: departmentIds.length ? departmentIds : [-1] } } : {};

      // Which categories are relevant to each role, matching the approve-permissions actually granted in RolesConfig.ts.
      const show = {
        weeklyReports: true, // every role here can review reports for their scope
        leaveRequests: true,
        promotions: bucket === 'superadmin' || bucket === 'admin' || bucket === 'hr',
        jobPostings: bucket === 'superadmin' || bucket === 'admin' || bucket === 'hr',
        projects: bucket === 'superadmin' || bucket === 'admin',
        tasks: bucket === 'superadmin' || bucket === 'admin' || bucket === 'hod',
        payroll: bucket === 'superadmin' || bucket === 'admin',
        overtime: bucket === 'superadmin' || bucket === 'admin',
      };

      const result: Record<string, { count: number; items: unknown[] }> = {};

      if (show.weeklyReports) {
        const where = { approvalStatus: 'Pending', ...staffScope };
        const [count, items] = await Promise.all([
          WeeklyReport.count({ where }),
          WeeklyReport.findAll({ where, include: [{ model: Staff, as: 'staff', attributes: ['firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.weeklyReports = { count, items };
      }

      if (show.leaveRequests) {
        const where = { status: 'Pending', ...staffScope };
        const [count, items] = await Promise.all([
          LeaveRequest.count({ where }),
          LeaveRequest.findAll({ where, include: [{ model: Staff, as: 'staff', attributes: ['firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.leaveRequests = { count, items };
      }

      if (show.promotions) {
        const where = { status: 'Proposed', ...staffScope };
        const [count, items] = await Promise.all([
          EmployeePromotion.count({ where }),
          EmployeePromotion.findAll({ where, include: [{ model: Staff, as: 'staff', attributes: ['firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.promotions = { count, items };
      }

      if (show.jobPostings) {
        const where = { status: 'Draft' as const };
        const [count, items] = await Promise.all([
          JobPosting.count({ where }),
          JobPosting.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.jobPostings = { count, items };
      }

      if (show.projects) {
        const where = { status: 'Planning' as const, ...deptScope };
        const [count, items] = await Promise.all([
          Project.count({ where }),
          Project.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.projects = { count, items };
      }

      if (show.tasks) {
        const where = { status: 'InReview' as const, ...assigneeScope };
        const [count, items] = await Promise.all([
          Task.count({ where }),
          Task.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.tasks = { count, items };
      }

      if (show.payroll) {
        const where = { status: 'Processed' as const };
        const [count, items] = await Promise.all([
          PayrollPeriod.count({ where }),
          PayrollPeriod.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.payroll = { count, items };
      }

      if (show.overtime) {
        const where = { status: 'Pending' as const, ...staffScope };
        const [count, items] = await Promise.all([
          Overtime.count({ where }),
          Overtime.findAll({ where, include: [{ model: Staff, as: 'staff', attributes: ['firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.overtime = { count, items };
      }

      ResponseFormatter.success(res, result, 'Approvals queue retrieved');
    }
  );

  static getHRStats = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalEmployees, newHires, openJobs, applicants, pendingLeave] = await Promise.all([
        Staff.count({ where: { status: 'Active' } }),
        Staff.count({ where: { status: 'Active', joiningDate: { [Op.gte]: thirtyDaysAgo } } }),
        JobPosting.count({ where: { status: 'Open' } }),
        JobApplication.count(),
        LeaveRequest.count({ where: { status: 'Pending' } }),
      ]);

      ResponseFormatter.success(res, { totalEmployees, newHires, openJobs, applicants, pendingLeave }, 'HR statistics retrieved');
    }
  );

  static getHRRecruitment = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const [openJobs, totalApplicants, shortlisted, hired] = await Promise.all([
        JobPosting.count({ where: { status: 'Open' } }),
        JobApplication.count(),
        JobApplication.count({ where: { status: 'Shortlisted' } }),
        JobApplication.count({ where: { status: 'Offered' } }),
      ]);

      ResponseFormatter.success(res, { openJobs, totalApplicants, shortlisted, hired }, 'Recruitment analytics retrieved');
    }
  );

  static getHODStats = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // HOD is department-only — scoped to req.user.departmentId (now correctly on the JWT — see AuthenticationService.ts).
      const departmentId = req.user?.departmentId;
      const staffWhere: Record<string, unknown> = { status: 'Active' };
      if (departmentId) staffWhere.departmentId = departmentId;

      const teamStaff = await Staff.findAll({ where: staffWhere, attributes: ['id'] });
      const staffIds = teamStaff.map((s: any) => s.id);
      const idFilter = { [Op.in]: staffIds.length ? staffIds : [-1] };

      const [teamSize, pendingApprovals, presentToday, todayTotal, activeProjects, reportsWaitingReview] = await Promise.all([
        Promise.resolve(staffIds.length),
        LeaveRequest.count({ where: { status: 'Pending', staffId: idFilter } }),
        Attendance.count({ where: { staffId: idFilter, attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: { [Op.in]: ['Present', 'Late'] } } }),
        Attendance.count({ where: { staffId: idFilter, attendanceDate: { [Op.between]: [startOfDay, endOfDay] } } }),
        departmentId ? Project.count({ where: { departmentId, status: 'Active' } }) : Project.count({ where: { status: 'Active' } }),
        WeeklyReport.count({ where: { approvalStatus: 'Pending', staffId: idFilter } }),
      ]);

      const attendancePct = todayTotal > 0 ? Math.round((presentToday / todayTotal) * 1000) / 10 : 0;

      // She may also be linked to other departments (short-staffed coverage) —
      // surface all of them so her dashboard isn't primary-department-only.
      const ownStaffForDepts = await getOwnStaff(req);
      let departments: { id: number; name: string; code?: string; isPrimary: boolean; teamSize: number }[] = [];
      if (ownStaffForDepts) {
        const deptLinks = await StaffDepartment.findAll({ where: { staffId: ownStaffForDepts.id }, attributes: ['departmentId', 'isPrimary'] });
        const deptIds = new Set<number>(deptLinks.map((l: any) => Number(l.departmentId)));
        if (departmentId) deptIds.add(Number(departmentId));
        const isPrimaryByDeptId = new Map<number, boolean>(deptLinks.map((l: any) => [Number(l.departmentId), !!l.isPrimary]));
        departments = await Promise.all(
          [...deptIds].map(async (deptId) => {
            const dept = await Department.findByPk(deptId, { attributes: ['id', 'name', 'code'] });
            return {
              id: deptId,
              name: (dept as any)?.name,
              code: (dept as any)?.code,
              isPrimary: isPrimaryByDeptId.get(deptId) ?? deptId === Number(departmentId),
              teamSize: await Staff.count({ where: { departmentId: deptId, status: 'Active' } }),
            };
          })
        );
      }

      ResponseFormatter.success(res, {
        teamSize, presentToday, attendancePct, pendingApprovals, activeProjects, reportsWaitingReview, departments,
      }, 'HOD dashboard statistics retrieved');
    }
  );

  static getStaffStats = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      // Staff sees only their own data.
      const ownStaff = await getOwnStaff(req);
      if (!ownStaff) {
        return ResponseFormatter.success(res, { myTasks: 0, pendingTasks: 0, leaveAvailable: 0, notifications: 0, departments: [] }, 'Staff dashboard statistics retrieved');
      }

      // A staff member can belong to up to 3 departments while short-staffed
      // (StaffDepartment join table) with one marked primary — show all of
      // them on her dashboard, not just the primary one.
      const deptLinks = await StaffDepartment.findAll({ where: { staffId: ownStaff.id }, attributes: ['departmentId', 'isPrimary'] });
      const deptIds = new Set<number>(deptLinks.map((l: any) => Number(l.departmentId)));
      if (ownStaff.departmentId) deptIds.add(Number(ownStaff.departmentId));
      const isPrimaryByDeptId = new Map<number, boolean>(deptLinks.map((l: any) => [Number(l.departmentId), !!l.isPrimary]));

      const departments = await Promise.all(
        [...deptIds].map(async (deptId) => {
          const dept = await Department.findByPk(deptId, { attributes: ['id', 'name', 'code'] });
          return {
            id: deptId,
            name: (dept as any)?.name,
            code: (dept as any)?.code,
            isPrimary: isPrimaryByDeptId.get(deptId) ?? deptId === Number(ownStaff.departmentId),
            teamSize: await Staff.count({ where: { departmentId: deptId } }),
          };
        })
      );

      const [myTasks, pendingTasks, leaveBalance] = await Promise.all([
        Task.count({ where: { assigneeId: ownStaff.id } }),
        Task.count({ where: { assigneeId: ownStaff.id, status: { [Op.notIn]: ['Done', 'Cancelled'] } } }),
        LeaveRequest.count({ where: { staffId: ownStaff.id, status: 'Approved' } }),
      ]);

      ResponseFormatter.success(res, {
        myTasks,
        pendingTasks,
        leaveAvailable: leaveBalance,
        notifications: 0,
        departments,
      }, 'Staff dashboard statistics retrieved');
    }
  );

  static getAccountantStats = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!(await hasPosition(req, 'accountant'))) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const ownStaff = await getOwnStaff(req);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [payrollOverview, pendingInvoices, revenueMTD, recentInvoices] = await Promise.all([
        getPayrollOverview(),
        Invoice.count({ where: { status: { [Op.in]: ['Issued', 'PartiallyPaid', 'Overdue'] } } }),
        Invoice.sum('total', { where: { status: 'Paid', invoiceDate: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth } } }),
        Invoice.findAll({ order: [['invoiceDate', 'DESC']], limit: 4 }),
      ]);

      // Department-scoped: budget utilization and pending expense approvals for the accountant's own department.
      let departmentBudget = null as null | { amount: number; spent: number; remaining: number; utilization: number };
      let pendingExpenseApprovals = 0;
      if (ownStaff?.departmentId) {
        const budgets = await Budget.findAll({
          where: { departmentId: ownStaff.departmentId, status: { [Op.in]: ['Approved', 'Active'] } },
        });
        if (budgets.length) {
          const amount = budgets.reduce((sum: number, b: any) => sum + Number(b.amount), 0);
          const spent = budgets.reduce((sum: number, b: any) => sum + Number(b.spent), 0);
          departmentBudget = {
            amount, spent, remaining: amount - spent,
            utilization: amount > 0 ? Math.round((spent / amount) * 1000) / 10 : 0,
          };
        }

        const deptStaff = await Staff.findAll({ where: { departmentId: ownStaff.departmentId }, attributes: ['id'] });
        const deptStaffIds = deptStaff.map((s: any) => s.id);
        pendingExpenseApprovals = await Expense.count({
          where: { staffId: { [Op.in]: deptStaffIds.length ? deptStaffIds : [-1] }, status: 'Submitted' },
        });
      }

      ResponseFormatter.success(res, {
        monthlyPayroll: payrollOverview.currentMonth?.totalNet ?? 0,
        pendingInvoices,
        revenueMTD: revenueMTD ?? 0,
        departmentBudget,
        pendingExpenseApprovals,
        recentInvoices: recentInvoices.map((inv: any) => ({
          id: inv.invoiceCode,
          amount: Number(inv.total),
          status: inv.status,
        })),
      }, 'Accountant dashboard statistics retrieved');
    }
  );

  static getReceptionistStats = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!(await hasPosition(req, 'receptionist'))) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const userId = req.user!.id;
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const [clientsOnFile, todaysEvents, openQueries, participations] = await Promise.all([
        Client.count(),
        CalendarEvent.findAll({
          where: { date: { [Op.between]: [startOfDay, endOfDay] } },
          order: [['date', 'ASC']],
          limit: 10,
        }),
        StaffQuery.count({ where: { status: 'Pending' } }),
        ConversationParticipant.findAll({ where: { userId }, attributes: ['conversationId'] }),
      ]);

      // Sum unread messages across every conversation this user participates in (same calc as message.routes.ts's conversation list).
      let unreadMessages = 0;
      for (const p of participations as any[]) {
        const totalMsgs = await Message.count({
          where: { conversationId: p.conversationId, senderUserId: { [Op.ne]: userId } },
        }).catch(() => 0);
        const readMsgs = await MessageRead.count({
          where: { userId },
          include: [{ model: Message, where: { conversationId: p.conversationId }, required: true }] as any,
        }).catch(() => 0);
        unreadMessages += Math.max(0, totalMsgs - readMsgs);
      }

      ResponseFormatter.success(res, {
        clientsOnFile,
        todaysAppointments: todaysEvents.length,
        unreadMessages,
        queriesOpen: openQueries,
        schedule: todaysEvents.map((e: any) => ({
          time: new Date(e.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          title: e.title,
          type: e.type,
        })),
      }, 'Receptionist dashboard statistics retrieved');
    }
  );

  static getHeadOfAdminStats = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Admin (branch/business-unit manager) sees only their own business unit; superadmin/headofadmin see everything.
      const bucket = getRoleBucket(req);
      const ownStaff = bucket === 'admin' ? await getOwnStaff(req) : null;
      const businessUnit = ownStaff?.businessUnit;
      const staffWhere: Record<string, unknown> = { status: 'Active' };
      if (businessUnit) staffWhere.businessUnit = businessUnit;

      const scopedStaffIds = businessUnit
        ? (await Staff.findAll({ where: staffWhere, attributes: ['id'] })).map((s: any) => s.id)
        : null;
      const attendanceScope = scopedStaffIds ? { staffId: { [Op.in]: scopedStaffIds.length ? scopedStaffIds : [-1] } } : {};
      const projectWhere: Record<string, unknown> = { status: 'Active' };

      const [totalStaff, pendingApprovals, todayPresent, todayTotal, activeProjects, pendingOvertime, pendingWeeklyReports] = await Promise.all([
        Staff.count({ where: staffWhere }),
        LeaveRequest.count({ where: scopedStaffIds ? { status: 'Pending', ...attendanceScope } : { status: 'Pending' } }),
        Attendance.count({ where: { ...attendanceScope, attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: { [Op.in]: ['Present', 'Late'] } } }),
        Attendance.count({ where: { ...attendanceScope, attendanceDate: { [Op.between]: [startOfDay, endOfDay] } } }),
        Project.count({ where: projectWhere }),
        Overtime.count({ where: scopedStaffIds ? { status: 'Pending', ...attendanceScope } : { status: 'Pending' } }),
        WeeklyReport.count({ where: scopedStaffIds ? { approvalStatus: 'Pending', ...attendanceScope } : { approvalStatus: 'Pending' } }),
      ]);

      const averageAttendance = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0;

      ResponseFormatter.success(res, { totalStaff, pendingApprovals, averageAttendance, activeProjects, pendingOvertime, pendingWeeklyReports }, 'Dashboard statistics retrieved');
    }
  );

  static getHeadOfAdminLeaveApprovals = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!canApproveLeave(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const approvals = await LeaveRequest.findAll({
        where: { status: 'Pending' },
        include: [
          { model: Staff, as: 'staff', attributes: ['firstName', 'lastName', 'employeeId'] },
          { model: LeaveType, as: 'leaveType', attributes: ['name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 20,
      });

      const result = approvals.map((a: any) => ({
        id: a.id.toString(),
        employee: `${a.staff?.firstName ?? ''} ${a.staff?.lastName ?? ''}`.trim(),
        type: a.leaveType?.name ?? 'Leave',
        startDate: a.startDate?.toISOString?.()?.slice(0, 10) ?? '',
        days: a.numberofDays,
        status: 'pending',
      }));

      ResponseFormatter.success(res, result, 'Leave approvals retrieved');
    }
  );

  static approveLeave = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!canApproveLeave(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const { leaveId } = req.params;
      const { remarks } = req.body;

      const leave = await LeaveRequest.findByPk(leaveId);
      if (!leave) {
        return ResponseFormatter.notFound(res, 'Leave request not found');
      }

      await leave.update({
        status: 'Approved',
        approvalComments: remarks ?? null,
        approvalDate: new Date(),
        approverUserId: req.user?.id,
      });

      ResponseFormatter.success(res, null, `Leave ${leaveId} approved successfully`);
    }
  );

  static rejectLeave = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!canApproveLeave(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const { leaveId } = req.params;
      const { reason } = req.body;

      const leave = await LeaveRequest.findByPk(leaveId);
      if (!leave) {
        return ResponseFormatter.notFound(res, 'Leave request not found');
      }

      await leave.update({
        status: 'Rejected',
        approvalComments: reason ?? null,
        approvalDate: new Date(),
        approverUserId: req.user?.id,
      });

      ResponseFormatter.success(res, null, `Leave ${leaveId} rejected successfully`);
    }
  );

  static getHeadOfAdminAttendanceReports = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const bucket = getRoleBucket(req);
      const ownStaff = bucket === 'admin' ? await getOwnStaff(req) : null;
      const staffWhere: Record<string, unknown> = { status: 'Active' };
      if (ownStaff?.businessUnit) staffWhere.businessUnit = ownStaff.businessUnit;

      const departments = await Department.findAll({
        attributes: ['id', 'name'],
        include: [
          {
            model: Staff,
            as: 'staff',
            attributes: ['id'],
            required: false,
            where: staffWhere,
          },
        ],
      });

      const reports = await Promise.all(
        departments.map(async (dept: any) => {
          const staffIds = dept.staff?.map((s: any) => s.id) ?? [];
          if (staffIds.length === 0) return { department: dept.name, present: 0, absent: 0, late: 0, rate: 0 };

          const [present, absent, late] = await Promise.all([
            Attendance.count({ where: { staffId: { [Op.in]: staffIds }, attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: 'Present' } }),
            Attendance.count({ where: { staffId: { [Op.in]: staffIds }, attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: 'Absent' } }),
            Attendance.count({ where: { staffId: { [Op.in]: staffIds }, attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: 'Late' } }),
          ]);

          const total = present + absent + late;
          const rate = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;
          return { department: dept.name, present, absent, late, rate };
        })
      );

      ResponseFormatter.success(res, reports.filter(r => r.present + r.absent + r.late > 0), 'Attendance reports retrieved');
    }
  );

  static getHeadOfAdminDepartmentKPIs = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const bucket = getRoleBucket(req);
      const ownStaff = bucket === 'admin' ? await getOwnStaff(req) : null;
      const staffWhere: Record<string, unknown> = { status: 'Active' };
      if (ownStaff?.businessUnit) staffWhere.businessUnit = ownStaff.businessUnit;

      const departments = await Department.findAll({
        attributes: ['id', 'name'],
        include: [
          { model: Staff, as: 'staff', attributes: ['id'], required: false, where: staffWhere },
        ],
      });

      const kpis = departments.map((d: any) => ({
        department: d.name,
        staffCount: d.staff?.length ?? 0,
        target: 100,
        actual: 100,
        variance: 0,
      }));

      ResponseFormatter.success(res, kpis, 'Department KPIs retrieved');
    }
  );

  static getHeadOfAdminProjects = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const bucket = getRoleBucket(req);
      const ownStaff = bucket === 'admin' ? await getOwnStaff(req) : null;
      const projectWhere: Record<string, unknown> = { status: { [Op.in]: ['Active', 'OnHold'] } };
      if (ownStaff?.businessUnit) {
        const deptStaff = await Staff.findAll({ where: { businessUnit: ownStaff.businessUnit }, attributes: ['departmentId'] });
        const deptIds = [...new Set(deptStaff.map((s: any) => s.departmentId).filter(Boolean))];
        projectWhere.departmentId = { [Op.in]: deptIds.length ? deptIds : [-1] };
      }

      const projects = await Project.findAll({
        attributes: ['id', 'name', 'status'],
        where: projectWhere,
        limit: 10,
        order: [['createdAt', 'DESC']],
      });

      const result = projects.map((p: any) => ({
        project: p.name,
        status: p.status === 'OnHold' ? 'On Hold' : p.status,
        progress: 0,
      }));

      ResponseFormatter.success(res, result, 'Projects retrieved');
    }
  );

  static getHeadOfAdminCommunications = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      ResponseFormatter.success(res, [], 'Communications retrieved');
    }
  );

  static getHeadOfAdminLeaveSummary = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!canReadLeave(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const [pending, approved, rejected] = await Promise.all([
        LeaveRequest.count({ where: { status: 'Pending' } }),
        LeaveRequest.count({ where: { status: 'Approved' } }),
        LeaveRequest.count({ where: { status: 'Rejected' } }),
      ]);

      ResponseFormatter.success(res, {
        pending,
        approved,
        rejected,
        monthlyQuota: 0,
        utilized: approved,
      }, 'Leave summary retrieved');
    }
  );
}

export default DashboardController;
