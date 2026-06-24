"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const sequelize_1 = require("sequelize");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const PermissionCodes_1 = require("../config/PermissionCodes");
const leaveApproval_1 = require("../utils/leaveApproval");
const Staff_model_1 = require("../models/Staff.model");
const Department_model_1 = require("../models/Department.model");
const StaffDepartment_model_1 = require("../models/StaffDepartment.model");
const Attendance_model_1 = require("../models/Attendance.model");
const Project_model_1 = require("../models/Project.model");
const Invoice_model_1 = require("../models/Invoice.model");
const LeaveRequest_model_1 = require("../models/LeaveRequest.model");
const Enrollment_model_1 = require("../models/Enrollment.model");
const Contact_model_1 = require("../models/Contact.model");
const Opportunity_model_1 = require("../models/Opportunity.model");
const LeaveType_model_1 = require("../models/LeaveType.model");
const WeeklyReport_model_1 = require("../models/WeeklyReport.model");
const EmployeePromotion_model_1 = require("../models/EmployeePromotion.model");
const JobPosting_model_1 = require("../models/JobPosting.model");
const JobApplication_model_1 = require("../models/JobApplication.model");
const Task_model_1 = require("../models/Task.model");
const PayrollPeriod_model_1 = require("../models/PayrollPeriod.model");
const Overtime_model_1 = require("../models/Overtime.model");
const Budget_model_1 = require("../models/Budget.model");
const Expense_model_1 = require("../models/Expense.model");
const Client_model_1 = require("../models/Client.model");
const CalendarEvent_model_1 = require("../models/CalendarEvent.model");
const StaffQuery_model_1 = require("../models/StaffQuery.model");
const ConversationParticipant_model_1 = require("../models/ConversationParticipant.model");
const Message_model_1 = require("../models/Message.model");
const MessageRead_model_1 = require("../models/MessageRead.model");
const StudentProfile_model_1 = require("../models/StudentProfile.model");
const FeeReceipt_model_1 = require("../models/FeeReceipt.model");
const Payment_model_1 = require("../models/Payment.model");
const payroll_routes_1 = require("../routes/payroll.routes");
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
function getRoleBucket(req) {
    const roles = (req.user?.roles ?? []).map(normaliseRole);
    if (roles.includes('superadmin'))
        return 'superadmin';
    if (roles.includes('admin') || roles.includes('headofadmin'))
        return 'admin';
    if (roles.includes('hr'))
        return 'hr';
    if (roles.includes('hod'))
        return 'hod';
    return 'staff';
}
async function getOwnStaff(req) {
    if (!req.user?.id)
        return null;
    return Staff_model_1.Staff.findOne({ where: { userId: req.user.id }, attributes: ['id', 'departmentId', 'businessUnit', 'position'] });
}
async function hasPosition(req, position) {
    if (isSuperAdmin(req))
        return true;
    const staff = await getOwnStaff(req);
    return !!staff?.position && staff.position.toLowerCase() === position.toLowerCase();
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
    const [totalEmployees, totalDepartments, todayAttendance, todayTotal, activeProjects, totalStudents, paymentRevenue, feeReceiptRevenue, pendingApprovals,] = await Promise.all([
        Staff_model_1.Staff.count({ where: { status: 'Active' } }),
        Department_model_1.Department.count(),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: { [sequelize_1.Op.in]: ['Present', 'Late'] } } }),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } } }),
        Project_model_1.Project.count({ where: { status: 'Active' } }),
        StudentProfile_model_1.StudentProfile.count(),
        Payment_model_1.Payment.sum('amount', { where: { status: 'Processed' } }),
        FeeReceipt_model_1.FeeReceipt.sum('amountPaid'),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
    ]);
    const attendanceRate = todayTotal > 0 ? Math.round((todayAttendance / todayTotal) * 1000) / 10 : 0;
    ResponseFormatter_1.ResponseFormatter.success(res, {
        totalEmployees,
        totalDepartments,
        attendanceRate,
        activeProjects,
        totalStudents,
        totalRevenue: (paymentRevenue ?? 0) + (feeReceiptRevenue ?? 0),
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
        const [paymentValue, feeReceiptValue] = await Promise.all([
            Payment_model_1.Payment.sum('amount', { where: { status: 'Processed', paymentDate: { [sequelize_1.Op.between]: [start, end] } } }),
            FeeReceipt_model_1.FeeReceipt.sum('amountPaid', { where: { paymentDate: { [sequelize_1.Op.between]: [start, end] } } }),
        ]);
        results.push({ month: MONTH_NAMES[month], revenue: (paymentValue ?? 0) + (feeReceiptValue ?? 0), target: 0 });
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
DashboardController.getApprovalsQueue = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const bucket = getRoleBucket(req);
    let staffIds = null;
    let departmentIds = null;
    if (bucket === 'hod') {
        const departmentId = req.user?.departmentId;
        const deptStaff = await Staff_model_1.Staff.findAll({ where: departmentId ? { departmentId } : {}, attributes: ['id'] });
        staffIds = deptStaff.map((s) => Number(s.id));
        departmentIds = departmentId ? [Number(departmentId)] : [];
    }
    else if (bucket === 'admin') {
        const ownStaff = await getOwnStaff(req);
        if (ownStaff?.businessUnit) {
            const buStaff = await Staff_model_1.Staff.findAll({ where: { businessUnit: ownStaff.businessUnit }, attributes: ['id', 'departmentId'] });
            staffIds = buStaff.map((s) => Number(s.id));
            departmentIds = [...new Set(buStaff.map((s) => s.departmentId).filter(Boolean).map(Number))];
        }
    }
    const staffScope = staffIds ? { staffId: { [sequelize_1.Op.in]: staffIds.length ? staffIds : [-1] } } : {};
    const assigneeScope = staffIds ? { assigneeId: { [sequelize_1.Op.in]: staffIds.length ? staffIds : [-1] } } : {};
    const deptScope = departmentIds ? { departmentId: { [sequelize_1.Op.in]: departmentIds.length ? departmentIds : [-1] } } : {};
    const show = {
        weeklyReports: true,
        leaveRequests: true,
        promotions: bucket === 'superadmin' || bucket === 'admin' || bucket === 'hr',
        jobPostings: bucket === 'superadmin' || bucket === 'admin' || bucket === 'hr',
        projects: bucket === 'superadmin' || bucket === 'admin',
        tasks: bucket === 'superadmin' || bucket === 'admin' || bucket === 'hod',
        payroll: bucket === 'superadmin' || bucket === 'admin',
        overtime: bucket === 'superadmin' || bucket === 'admin',
    };
    const result = {};
    if (show.weeklyReports) {
        const where = { approvalStatus: 'Pending', ...staffScope };
        const [count, items] = await Promise.all([
            WeeklyReport_model_1.WeeklyReport.count({ where }),
            WeeklyReport_model_1.WeeklyReport.findAll({ where, include: [{ model: Staff_model_1.Staff, as: 'staff', attributes: ['firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.weeklyReports = { count, items };
    }
    if (show.leaveRequests) {
        const where = { status: 'Pending', ...staffScope };
        const [count, items] = await Promise.all([
            LeaveRequest_model_1.LeaveRequest.count({ where }),
            LeaveRequest_model_1.LeaveRequest.findAll({ where, include: [{ model: Staff_model_1.Staff, as: 'staff', attributes: ['firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.leaveRequests = { count, items };
    }
    if (show.promotions) {
        const where = { status: 'Proposed', ...staffScope };
        const [count, items] = await Promise.all([
            EmployeePromotion_model_1.EmployeePromotion.count({ where }),
            EmployeePromotion_model_1.EmployeePromotion.findAll({ where, include: [{ model: Staff_model_1.Staff, as: 'staff', attributes: ['firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.promotions = { count, items };
    }
    if (show.jobPostings) {
        const where = { status: 'Draft' };
        const [count, items] = await Promise.all([
            JobPosting_model_1.JobPosting.count({ where }),
            JobPosting_model_1.JobPosting.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.jobPostings = { count, items };
    }
    if (show.projects) {
        const where = { status: 'Planning', ...deptScope };
        const [count, items] = await Promise.all([
            Project_model_1.Project.count({ where }),
            Project_model_1.Project.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.projects = { count, items };
    }
    if (show.tasks) {
        const where = { status: 'InReview', ...assigneeScope };
        const [count, items] = await Promise.all([
            Task_model_1.Task.count({ where }),
            Task_model_1.Task.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.tasks = { count, items };
    }
    if (show.payroll) {
        const where = { status: 'Processed' };
        const [count, items] = await Promise.all([
            PayrollPeriod_model_1.PayrollPeriod.count({ where }),
            PayrollPeriod_model_1.PayrollPeriod.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.payroll = { count, items };
    }
    if (show.overtime) {
        const where = { status: 'Pending', ...staffScope };
        const [count, items] = await Promise.all([
            Overtime_model_1.Overtime.count({ where }),
            Overtime_model_1.Overtime.findAll({ where, include: [{ model: Staff_model_1.Staff, as: 'staff', attributes: ['firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 5 }),
        ]);
        result.overtime = { count, items };
    }
    ResponseFormatter_1.ResponseFormatter.success(res, result, 'Approvals queue retrieved');
});
DashboardController.getHRStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [totalEmployees, newHires, openJobs, applicants, pendingLeave] = await Promise.all([
        Staff_model_1.Staff.count({ where: { status: 'Active' } }),
        Staff_model_1.Staff.count({ where: { status: 'Active', joiningDate: { [sequelize_1.Op.gte]: thirtyDaysAgo } } }),
        JobPosting_model_1.JobPosting.count({ where: { status: 'Open' } }),
        JobApplication_model_1.JobApplication.count(),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { totalEmployees, newHires, openJobs, applicants, pendingLeave }, 'HR statistics retrieved');
});
DashboardController.getHRRecruitment = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const [openJobs, totalApplicants, shortlisted, hired] = await Promise.all([
        JobPosting_model_1.JobPosting.count({ where: { status: 'Open' } }),
        JobApplication_model_1.JobApplication.count(),
        JobApplication_model_1.JobApplication.count({ where: { status: 'Shortlisted' } }),
        JobApplication_model_1.JobApplication.count({ where: { status: 'Offered' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { openJobs, totalApplicants, shortlisted, hired }, 'Recruitment analytics retrieved');
});
DashboardController.getHODStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const departmentId = req.user?.departmentId;
    const staffWhere = { status: 'Active' };
    if (departmentId)
        staffWhere.departmentId = departmentId;
    const teamStaff = await Staff_model_1.Staff.findAll({ where: staffWhere, attributes: ['id'] });
    const staffIds = teamStaff.map((s) => s.id);
    const idFilter = { [sequelize_1.Op.in]: staffIds.length ? staffIds : [-1] };
    const [teamSize, pendingApprovals, presentToday, todayTotal, activeProjects, reportsWaitingReview] = await Promise.all([
        Promise.resolve(staffIds.length),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending', staffId: idFilter } }),
        Attendance_model_1.Attendance.count({ where: { staffId: idFilter, attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: { [sequelize_1.Op.in]: ['Present', 'Late'] } } }),
        Attendance_model_1.Attendance.count({ where: { staffId: idFilter, attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } } }),
        departmentId ? Project_model_1.Project.count({ where: { departmentId, status: 'Active' } }) : Project_model_1.Project.count({ where: { status: 'Active' } }),
        WeeklyReport_model_1.WeeklyReport.count({ where: { approvalStatus: 'Pending', staffId: idFilter } }),
    ]);
    const attendancePct = todayTotal > 0 ? Math.round((presentToday / todayTotal) * 1000) / 10 : 0;
    const ownStaffForDepts = await getOwnStaff(req);
    let departments = [];
    let studentCount = 0;
    if (ownStaffForDepts) {
        const deptLinks = await StaffDepartment_model_1.StaffDepartment.findAll({ where: { staffId: ownStaffForDepts.id }, attributes: ['departmentId', 'isPrimary'] });
        const deptIds = new Set(deptLinks.map((l) => Number(l.departmentId)));
        if (departmentId)
            deptIds.add(Number(departmentId));
        const isPrimaryByDeptId = new Map(deptLinks.map((l) => [Number(l.departmentId), !!l.isPrimary]));
        departments = await Promise.all([...deptIds].map(async (deptId) => {
            const dept = await Department_model_1.Department.findByPk(deptId, { attributes: ['id', 'name', 'code'] });
            return {
                id: deptId,
                name: dept?.name,
                code: dept?.code,
                isPrimary: isPrimaryByDeptId.get(deptId) ?? deptId === Number(departmentId),
                teamSize: await Staff_model_1.Staff.count({ where: { departmentId: deptId, status: 'Active' } }),
            };
        }));
        studentCount = deptIds.size
            ? await StudentProfile_model_1.StudentProfile.count({ where: { departmentId: { [sequelize_1.Op.in]: [...deptIds] } } })
            : 0;
    }
    ResponseFormatter_1.ResponseFormatter.success(res, {
        teamSize, presentToday, attendancePct, pendingApprovals, activeProjects, reportsWaitingReview, departments, studentCount,
    }, 'HOD dashboard statistics retrieved');
});
DashboardController.getStaffStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const ownStaff = await getOwnStaff(req);
    if (!ownStaff) {
        return ResponseFormatter_1.ResponseFormatter.success(res, { myTasks: 0, pendingTasks: 0, leaveAvailable: 0, notifications: 0, departments: [] }, 'Staff dashboard statistics retrieved');
    }
    const deptLinks = await StaffDepartment_model_1.StaffDepartment.findAll({ where: { staffId: ownStaff.id }, attributes: ['departmentId', 'isPrimary'] });
    const deptIds = new Set(deptLinks.map((l) => Number(l.departmentId)));
    if (ownStaff.departmentId)
        deptIds.add(Number(ownStaff.departmentId));
    const isPrimaryByDeptId = new Map(deptLinks.map((l) => [Number(l.departmentId), !!l.isPrimary]));
    const departments = await Promise.all([...deptIds].map(async (deptId) => {
        const dept = await Department_model_1.Department.findByPk(deptId, { attributes: ['id', 'name', 'code'] });
        return {
            id: deptId,
            name: dept?.name,
            code: dept?.code,
            isPrimary: isPrimaryByDeptId.get(deptId) ?? deptId === Number(ownStaff.departmentId),
            teamSize: await Staff_model_1.Staff.count({ where: { departmentId: deptId } }),
        };
    }));
    const [myTasks, pendingTasks, leaveBalance] = await Promise.all([
        Task_model_1.Task.count({ where: { assigneeId: ownStaff.id } }),
        Task_model_1.Task.count({ where: { assigneeId: ownStaff.id, status: { [sequelize_1.Op.notIn]: ['Done', 'Cancelled'] } } }),
        LeaveRequest_model_1.LeaveRequest.count({ where: { staffId: ownStaff.id, status: 'Approved' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, {
        myTasks,
        pendingTasks,
        leaveAvailable: leaveBalance,
        notifications: 0,
        departments,
    }, 'Staff dashboard statistics retrieved');
});
DashboardController.getAccountantStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!(await hasPosition(req, 'accountant'))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const ownStaff = await getOwnStaff(req);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [payrollOverview, pendingInvoices, paymentRevenueMTD, feeReceiptRevenueMTD, recentInvoices] = await Promise.all([
        (0, payroll_routes_1.getPayrollOverview)(),
        Invoice_model_1.Invoice.count({ where: { status: { [sequelize_1.Op.in]: ['Issued', 'PartiallyPaid', 'Overdue'] } } }),
        Payment_model_1.Payment.sum('amount', { where: { status: 'Processed', paymentDate: { [sequelize_1.Op.gte]: startOfMonth, [sequelize_1.Op.lt]: startOfNextMonth } } }),
        FeeReceipt_model_1.FeeReceipt.sum('amountPaid', { where: { paymentDate: { [sequelize_1.Op.gte]: startOfMonth, [sequelize_1.Op.lt]: startOfNextMonth } } }),
        Invoice_model_1.Invoice.findAll({ order: [['invoiceDate', 'DESC']], limit: 4 }),
    ]);
    let departmentBudget = null;
    let pendingExpenseApprovals = 0;
    if (ownStaff?.departmentId) {
        const budgets = await Budget_model_1.Budget.findAll({
            where: { departmentId: ownStaff.departmentId, status: { [sequelize_1.Op.in]: ['Approved', 'Active'] } },
        });
        if (budgets.length) {
            const amount = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
            const spent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
            departmentBudget = {
                amount, spent, remaining: amount - spent,
                utilization: amount > 0 ? Math.round((spent / amount) * 1000) / 10 : 0,
            };
        }
        const deptStaff = await Staff_model_1.Staff.findAll({ where: { departmentId: ownStaff.departmentId }, attributes: ['id'] });
        const deptStaffIds = deptStaff.map((s) => s.id);
        pendingExpenseApprovals = await Expense_model_1.Expense.count({
            where: { staffId: { [sequelize_1.Op.in]: deptStaffIds.length ? deptStaffIds : [-1] }, status: 'Submitted' },
        });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, {
        monthlyPayroll: payrollOverview.currentMonth?.totalNet ?? 0,
        pendingInvoices,
        revenueMTD: (paymentRevenueMTD ?? 0) + (feeReceiptRevenueMTD ?? 0),
        departmentBudget,
        pendingExpenseApprovals,
        recentInvoices: recentInvoices.map((inv) => ({
            id: inv.invoiceCode,
            amount: Number(inv.total),
            status: inv.status,
        })),
    }, 'Accountant dashboard statistics retrieved');
});
DashboardController.getReceptionistStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!(await hasPosition(req, 'receptionist'))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const userId = req.user.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const [clientsOnFile, todaysEvents, openQueries, participations] = await Promise.all([
        Client_model_1.Client.count(),
        CalendarEvent_model_1.CalendarEvent.findAll({
            where: { date: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } },
            order: [['date', 'ASC']],
            limit: 10,
        }),
        StaffQuery_model_1.StaffQuery.count({ where: { status: 'Pending' } }),
        ConversationParticipant_model_1.ConversationParticipant.findAll({ where: { userId }, attributes: ['conversationId'] }),
    ]);
    let unreadMessages = 0;
    for (const p of participations) {
        const totalMsgs = await Message_model_1.Message.count({
            where: { conversationId: p.conversationId, senderUserId: { [sequelize_1.Op.ne]: userId } },
        }).catch(() => 0);
        const readMsgs = await MessageRead_model_1.MessageRead.count({
            where: { userId },
            include: [{ model: Message_model_1.Message, where: { conversationId: p.conversationId }, required: true }],
        }).catch(() => 0);
        unreadMessages += Math.max(0, totalMsgs - readMsgs);
    }
    ResponseFormatter_1.ResponseFormatter.success(res, {
        clientsOnFile,
        todaysAppointments: todaysEvents.length,
        unreadMessages,
        queriesOpen: openQueries,
        schedule: todaysEvents.map((e) => ({
            time: new Date(e.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            title: e.title,
            type: e.type,
        })),
    }, 'Receptionist dashboard statistics retrieved');
});
DashboardController.getHeadOfAdminStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!isAuthenticated(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const staffWhere = { status: 'Active' };
    const projectWhere = { status: 'Active' };
    const [totalEmployees, pendingApprovals, todayPresent, todayTotal, activeProjects, pendingOvertime, pendingWeeklyReports, studentCount] = await Promise.all([
        Staff_model_1.Staff.count({ where: staffWhere }),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: { [sequelize_1.Op.in]: ['Present', 'Late'] } } }),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } } }),
        Project_model_1.Project.count({ where: projectWhere }),
        Overtime_model_1.Overtime.count({ where: { status: 'Pending' } }),
        WeeklyReport_model_1.WeeklyReport.count({ where: { approvalStatus: 'Pending' } }),
        StudentProfile_model_1.StudentProfile.count(),
    ]);
    const averageAttendance = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0;
    ResponseFormatter_1.ResponseFormatter.success(res, { totalEmployees, pendingApprovals, averageAttendance, activeProjects, pendingOvertime, pendingWeeklyReports, studentCount }, 'Dashboard statistics retrieved');
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
    const result = await Promise.all(approvals.map(async (a) => ({
        id: a.id.toString(),
        employee: `${a.staff?.firstName ?? ''} ${a.staff?.lastName ?? ''}`.trim(),
        type: a.leaveType?.name ?? 'Leave',
        startDate: a.startDate?.toISOString?.()?.slice(0, 10) ?? '',
        days: a.numberofDays,
        status: 'pending',
        requiresSuperAdminApproval: await (0, leaveApproval_1.requesterIsHrOrAdmin)(a.staffId),
    })));
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
    if (await (0, leaveApproval_1.requesterIsHrOrAdmin)(leave.staffId) && !(0, leaveApproval_1.isSuperAdminOnly)(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only Super Admin can approve leave requests from HR or Admin staff');
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
    if (await (0, leaveApproval_1.requesterIsHrOrAdmin)(leave.staffId) && !(0, leaveApproval_1.isSuperAdminOnly)(req)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only Super Admin can reject leave requests from HR or Admin staff');
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
    const bucket = getRoleBucket(req);
    const ownStaff = bucket === 'admin' ? await getOwnStaff(req) : null;
    const staffWhere = { status: 'Active' };
    if (ownStaff?.businessUnit)
        staffWhere.businessUnit = ownStaff.businessUnit;
    const departments = await Department_model_1.Department.findAll({
        attributes: ['id', 'name'],
        include: [
            {
                model: Staff_model_1.Staff,
                as: 'staff',
                attributes: ['id'],
                required: false,
                where: staffWhere,
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
    const bucket = getRoleBucket(req);
    const ownStaff = bucket === 'admin' ? await getOwnStaff(req) : null;
    const staffWhere = { status: 'Active' };
    if (ownStaff?.businessUnit)
        staffWhere.businessUnit = ownStaff.businessUnit;
    const departments = await Department_model_1.Department.findAll({
        attributes: ['id', 'name'],
        include: [
            { model: Staff_model_1.Staff, as: 'staff', attributes: ['id'], required: false, where: staffWhere },
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
    const bucket = getRoleBucket(req);
    const ownStaff = bucket === 'admin' ? await getOwnStaff(req) : null;
    const projectWhere = { status: { [sequelize_1.Op.in]: ['Active', 'OnHold'] } };
    if (ownStaff?.businessUnit) {
        const deptStaff = await Staff_model_1.Staff.findAll({ where: { businessUnit: ownStaff.businessUnit }, attributes: ['departmentId'] });
        const deptIds = [...new Set(deptStaff.map((s) => s.departmentId).filter(Boolean))];
        projectWhere.departmentId = { [sequelize_1.Op.in]: deptIds.length ? deptIds : [-1] };
    }
    const projects = await Project_model_1.Project.findAll({
        attributes: ['id', 'name', 'status'],
        where: projectWhere,
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