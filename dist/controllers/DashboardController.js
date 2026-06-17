"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const sequelize_1 = require("sequelize");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const PermissionCodes_1 = require("../config/PermissionCodes");
const Staff_model_1 = require("../models/Staff.model");
const Department_model_1 = require("../models/Department.model");
const Attendance_model_1 = require("../models/Attendance.model");
const Project_model_1 = require("../models/Project.model");
const Invoice_model_1 = require("../models/Invoice.model");
const LeaveRequest_model_1 = require("../models/LeaveRequest.model");
const Enrollment_model_1 = require("../models/Enrollment.model");
const Contact_model_1 = require("../models/Contact.model");
const Opportunity_model_1 = require("../models/Opportunity.model");
const LeaveType_model_1 = require("../models/LeaveType.model");
function normaliseRole(r) {
    return r.toLowerCase().replace(/[^a-z]/g, '');
}
function isSuperAdmin(req) {
    const SUPER_CODES = new Set(['superadmin', 'admin', 'headofadmin']);
    return !!req.user?.roles?.some((r) => SUPER_CODES.has(normaliseRole(r)));
}
function isAuthenticated(req) {
    return !!req.user;
}
function canApproveLeave(req) {
    return isSuperAdmin(req) || !!req.user?.permissions.some(p => [PermissionCodes_1.PermissionCode.LEAVE_REQUEST_APPROVE_ALL, PermissionCodes_1.PermissionCode.LEAVE_REQUEST_APPROVE_OWN_DEPARTMENT].includes(p));
}
function canReadLeave(req) {
    return isSuperAdmin(req) || !!req.user?.permissions.some(p => [PermissionCodes_1.PermissionCode.LEAVE_REQUEST_READ_ALL, PermissionCodes_1.PermissionCode.LEAVE_REQUEST_READ_OWN_DEPARTMENT, PermissionCodes_1.PermissionCode.LEAVE_REQUEST_READ_OWN].includes(p));
}
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
class DashboardController {
}
exports.DashboardController = DashboardController;
_a = DashboardController;
DashboardController.getSuperAdminStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions to view dashboard');
    }
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const [totalEmployees, totalDepartments, todayAttendance, todayTotal, activeProjects, totalStudents, revenueResult, pendingApprovals,] = await Promise.all([
        Staff_model_1.Staff.count({ where: { status: 'Active' } }),
        Department_model_1.Department.count(),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: { [sequelize_1.Op.in]: ['Present', 'Late'] } } }),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } } }),
        Project_model_1.Project.count({ where: { status: 'Active' } }),
        Enrollment_model_1.Enrollment.count({ where: { status: { [sequelize_1.Op.in]: ['Enrolled', 'InProgress'] } } }),
        Invoice_model_1.Invoice.sum('total', { where: { status: 'Paid' } }),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
    ]);
    const attendanceRate = todayTotal > 0 ? Math.round((todayAttendance / todayTotal) * 1000) / 10 : 0;
    ResponseFormatter_1.ResponseFormatter.success(res, {
        totalEmployees,
        totalDepartments,
        attendanceRate,
        activeProjects,
        totalStudents,
        totalRevenue: revenueResult ?? 0,
        pendingApprovals,
        activePayrolls: totalEmployees,
    }, 'Dashboard statistics retrieved');
});
DashboardController.getSuperAdminAttendance = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const days = parseInt(req.query.days) || 7;
    const results = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        const [present, absent, late] = await Promise.all([
            Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [start, end] }, status: 'Present' } }),
            Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [start, end] }, status: 'Absent' } }),
            Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [start, end] }, status: 'Late' } }),
        ]);
        results.push({
            date: date.toISOString().slice(0, 10),
            present,
            absent,
            late,
        });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, results, 'Attendance data retrieved');
});
DashboardController.getSuperAdminRevenue = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const monthsBack = parseInt(req.query.months) || 6;
    const results = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = d.getMonth();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);
        const value = await Invoice_model_1.Invoice.sum('total', {
            where: { status: 'Paid', invoiceDate: { [sequelize_1.Op.between]: [start, end] } },
        });
        results.push({ month: MONTH_NAMES[month], revenue: value ?? 0, target: 0 });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, results, 'Revenue data retrieved');
});
DashboardController.getSuperAdminPayroll = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const totalPaid = await Invoice_model_1.Invoice.sum('total', { where: { status: 'Paid' } }) ?? 0;
    const payrollData = [
        { category: 'Revenue (Paid)', value: totalPaid },
        { category: 'Pending', value: await Invoice_model_1.Invoice.sum('total', { where: { status: 'Issued' } }) ?? 0 },
        { category: 'Overdue', value: await Invoice_model_1.Invoice.sum('total', { where: { status: 'Overdue' } }) ?? 0 },
        { category: 'Cancelled', value: await Invoice_model_1.Invoice.sum('total', { where: { status: 'Cancelled' } }) ?? 0 },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, payrollData, 'Payroll data retrieved');
});
DashboardController.getSuperAdminDepartments = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const departments = await Department_model_1.Department.findAll({
        attributes: ['id', 'name'],
        include: [
            { model: Staff_model_1.Staff, as: 'staff', attributes: [], required: false, where: { status: 'Active' } },
        ],
    });
    const result = departments.map((d) => ({
        name: d.name,
        value: d.staff?.length ?? 0,
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, result, 'Department data retrieved');
});
DashboardController.getSuperAdminStudents = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const [totalEnrolled, activeStudents, completedCourses, droppedStudents] = await Promise.all([
        Enrollment_model_1.Enrollment.count(),
        Enrollment_model_1.Enrollment.count({ where: { status: { [sequelize_1.Op.in]: ['Enrolled', 'InProgress'] } } }),
        Enrollment_model_1.Enrollment.count({ where: { status: 'Completed' } }),
        Enrollment_model_1.Enrollment.count({ where: { status: 'Dropped' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { totalEnrolled, activeStudents, completedCourses, droppedStudents }, 'Student analytics retrieved');
});
DashboardController.getSuperAdminProjects = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const [active, completed, onHold, cancelled] = await Promise.all([
        Project_model_1.Project.count({ where: { status: 'Active' } }),
        Project_model_1.Project.count({ where: { status: 'Completed' } }),
        Project_model_1.Project.count({ where: { status: 'OnHold' } }),
        Project_model_1.Project.count({ where: { status: 'Cancelled' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, [
        { name: 'Active Projects', value: active },
        { name: 'Completed', value: completed },
        { name: 'On Hold', value: onHold },
        { name: 'Cancelled', value: cancelled },
    ], 'Project data retrieved');
});
DashboardController.getSuperAdminCRM = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const [totalLeads, totalOpportunities, convertedDeals, lostDeals] = await Promise.all([
        Contact_model_1.Contact.count({ where: { status: { [sequelize_1.Op.in]: ['Lead', 'Prospect'] } } }),
        Opportunity_model_1.Opportunity.count(),
        Opportunity_model_1.Opportunity.count({ where: { stage: 'Won' } }),
        Opportunity_model_1.Opportunity.count({ where: { stage: 'Lost' } }),
    ]);
    const conversionRate = totalOpportunities > 0
        ? Math.round((convertedDeals / totalOpportunities) * 1000) / 10
        : 0;
    ResponseFormatter_1.ResponseFormatter.success(res, { totalLeads, totalOpportunities, convertedDeals, lostDeals, conversionRate }, 'CRM metrics retrieved');
});
DashboardController.getSuperAdminNotifications = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isSuperAdmin(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const limit = parseInt(req.query.limit) || 5;
    const [pendingLeaves, overdueInvoices] = await Promise.all([
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
        Invoice_model_1.Invoice.count({ where: { status: 'Overdue' } }),
    ]);
    const now = new Date().toISOString();
    const notifications = [];
    if (pendingLeaves > 0) {
        notifications.push({ id: 'leave', title: 'Leave Requests', message: `${pendingLeaves} leave request${pendingLeaves !== 1 ? 's' : ''} pending approval`, type: 'warning', read: false, created_at: now });
    }
    if (overdueInvoices > 0) {
        notifications.push({ id: 'invoice', title: 'Overdue Invoices', message: `${overdueInvoices} invoice${overdueInvoices !== 1 ? 's' : ''} are overdue`, type: 'error', read: false, created_at: now });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, notifications.slice(0, limit), 'Notifications retrieved');
});
DashboardController.getHeadOfAdminStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const [totalStaff, pendingApprovals, todayPresent, todayTotal, activeProjects] = await Promise.all([
        Staff_model_1.Staff.count({ where: { status: 'Active' } }),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: { [sequelize_1.Op.in]: ['Present', 'Late'] } } }),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } } }),
        Project_model_1.Project.count({ where: { status: 'Active' } }),
    ]);
    const averageAttendance = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0;
    ResponseFormatter_1.ResponseFormatter.success(res, { totalStaff, pendingApprovals, averageAttendance, activeProjects }, 'Dashboard statistics retrieved');
});
DashboardController.getHeadOfAdminLeaveApprovals = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!canApproveLeave(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const approvals = await LeaveRequest_model_1.LeaveRequest.findAll({
        where: { status: 'Pending' },
        include: [
            { model: Staff_model_1.Staff, as: 'staff', attributes: ['firstName', 'lastName', 'employeeId'] },
            { model: LeaveType_model_1.LeaveType, as: 'leaveType', attributes: ['name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 20,
    });
    const result = approvals.map((a) => ({
        id: a.id.toString(),
        employee: `${a.staff?.firstName ?? ''} ${a.staff?.lastName ?? ''}`.trim(),
        type: a.leaveType?.name ?? 'Leave',
        startDate: a.startDate?.toISOString?.()?.slice(0, 10) ?? '',
        days: a.numberofDays,
        status: 'pending',
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, result, 'Leave approvals retrieved');
});
DashboardController.approveLeave = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!canApproveLeave(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const { leaveId } = req.params;
    const { remarks } = req.body;
    const leave = await LeaveRequest_model_1.LeaveRequest.findByPk(leaveId);
    if (!leave) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Leave request not found');
    }
    await leave.update({
        status: 'Approved',
        approvalComments: remarks ?? null,
        approvalDate: new Date(),
        approverUserId: req.user?.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, null, `Leave ${leaveId} approved successfully`);
});
DashboardController.rejectLeave = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!canApproveLeave(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const { leaveId } = req.params;
    const { reason } = req.body;
    const leave = await LeaveRequest_model_1.LeaveRequest.findByPk(leaveId);
    if (!leave) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Leave request not found');
    }
    await leave.update({
        status: 'Rejected',
        approvalComments: reason ?? null,
        approvalDate: new Date(),
        approverUserId: req.user?.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, null, `Leave ${leaveId} rejected successfully`);
});
DashboardController.getHeadOfAdminAttendanceReports = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const departments = await Department_model_1.Department.findAll({
        attributes: ['id', 'name'],
        include: [
            {
                model: Staff_model_1.Staff,
                as: 'staff',
                attributes: ['id'],
                required: false,
                where: { status: 'Active' },
            },
        ],
    });
    const reports = await Promise.all(departments.map(async (dept) => {
        const staffIds = dept.staff?.map((s) => s.id) ?? [];
        if (staffIds.length === 0)
            return { department: dept.name, present: 0, absent: 0, late: 0, rate: 0 };
        const [present, absent, late] = await Promise.all([
            Attendance_model_1.Attendance.count({ where: { staffId: { [sequelize_1.Op.in]: staffIds }, attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: 'Present' } }),
            Attendance_model_1.Attendance.count({ where: { staffId: { [sequelize_1.Op.in]: staffIds }, attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: 'Absent' } }),
            Attendance_model_1.Attendance.count({ where: { staffId: { [sequelize_1.Op.in]: staffIds }, attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: 'Late' } }),
        ]);
        const total = present + absent + late;
        const rate = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;
        return { department: dept.name, present, absent, late, rate };
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, reports.filter(r => r.present + r.absent + r.late > 0), 'Attendance reports retrieved');
});
DashboardController.getHeadOfAdminDepartmentKPIs = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const departments = await Department_model_1.Department.findAll({
        attributes: ['id', 'name'],
        include: [
            { model: Staff_model_1.Staff, as: 'staff', attributes: ['id'], required: false, where: { status: 'Active' } },
        ],
    });
    const kpis = departments.map((d) => ({
        department: d.name,
        staffCount: d.staff?.length ?? 0,
        target: 100,
        actual: 100,
        variance: 0,
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, kpis, 'Department KPIs retrieved');
});
DashboardController.getHeadOfAdminProjects = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const projects = await Project_model_1.Project.findAll({
        attributes: ['id', 'name', 'status'],
        where: { status: { [sequelize_1.Op.in]: ['Active', 'OnHold'] } },
        limit: 10,
        order: [['createdAt', 'DESC']],
    });
    const result = projects.map((p) => ({
        project: p.name,
        status: p.status === 'OnHold' ? 'On Hold' : p.status,
        progress: 0,
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, result, 'Projects retrieved');
});
DashboardController.getHeadOfAdminCommunications = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    ResponseFormatter_1.ResponseFormatter.success(res, [], 'Communications retrieved');
});
DashboardController.getHeadOfAdminLeaveSummary = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!canReadLeave(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const [pending, approved, rejected] = await Promise.all([
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Approved' } }),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Rejected' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, {
        pending,
        approved,
        rejected,
        monthlyQuota: 0,
        utilized: approved,
    }, 'Leave summary retrieved');
});
exports.default = DashboardController;
//# sourceMappingURL=DashboardController.js.map