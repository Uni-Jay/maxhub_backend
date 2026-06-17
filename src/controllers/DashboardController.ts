// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { PermissionCode } from '@config/PermissionCodes';
import { Staff } from '@models/Staff.model';
import { Department } from '@models/Department.model';
import { Attendance } from '@models/Attendance.model';
import { Project } from '@models/Project.model';
import { Invoice } from '@models/Invoice.model';
import { LeaveRequest } from '@models/LeaveRequest.model';
import { Enrollment } from '@models/Enrollment.model';
import { Contact } from '@models/Contact.model';
import { Opportunity } from '@models/Opportunity.model';
import { LeaveType } from '@models/LeaveType.model';

interface AuthenticatedRequest extends Request {
  user?: {
    id: bigint;
    uuid: string;
    email: string;
    roles: string[];
    permissions: string[];
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

  static getHeadOfAdminStats = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!isAuthenticated(req)) {
        return ResponseFormatter.forbidden(res, 'Insufficient permissions');
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const [totalStaff, pendingApprovals, todayPresent, todayTotal, activeProjects] = await Promise.all([
        Staff.count({ where: { status: 'Active' } }),
        LeaveRequest.count({ where: { status: 'Pending' } }),
        Attendance.count({ where: { attendanceDate: { [Op.between]: [startOfDay, endOfDay] }, status: { [Op.in]: ['Present', 'Late'] } } }),
        Attendance.count({ where: { attendanceDate: { [Op.between]: [startOfDay, endOfDay] } } }),
        Project.count({ where: { status: 'Active' } }),
      ]);

      const averageAttendance = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0;

      ResponseFormatter.success(res, { totalStaff, pendingApprovals, averageAttendance, activeProjects }, 'Dashboard statistics retrieved');
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

      const departments = await Department.findAll({
        attributes: ['id', 'name'],
        include: [
          {
            model: Staff,
            as: 'staff',
            attributes: ['id'],
            required: false,
            where: { status: 'Active' },
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

      const departments = await Department.findAll({
        attributes: ['id', 'name'],
        include: [
          { model: Staff, as: 'staff', attributes: ['id'], required: false, where: { status: 'Active' } },
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

      const projects = await Project.findAll({
        attributes: ['id', 'name', 'status'],
        where: { status: { [Op.in]: ['Active', 'OnHold'] } },
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
