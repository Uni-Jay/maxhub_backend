"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const permissions_1 = require("@constants/permissions");
class DashboardController {
}
exports.DashboardController = DashboardController;
_a = DashboardController;
DashboardController.getSuperAdminStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_DASHBOARD_VIEW)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions to view dashboard');
    }
    const stats = {
        totalEmployees: 185,
        totalDepartments: 12,
        attendanceRate: 97.2,
        activeProjects: 18,
        totalStudents: 1250,
        totalRevenue: 256000,
        pendingApprovals: 12,
        activePayrolls: 185,
    };
    ResponseFormatter_1.ResponseFormatter.success(res, stats, 'Dashboard statistics retrieved');
});
DashboardController.getSuperAdminAttendance = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_ATTENDANCE_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const days = parseInt(req.query.days) || 7;
    const attendanceData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        return {
            date: dayName,
            present: Math.floor(Math.random() * (250 - 230)) + 230,
            absent: Math.floor(Math.random() * 5),
            late: Math.floor(Math.random() * 4),
        };
    });
    ResponseFormatter_1.ResponseFormatter.success(res, attendanceData, 'Attendance data retrieved');
});
DashboardController.getSuperAdminRevenue = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_REPORT_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const months = parseInt(req.query.months) || 6;
    const revenueData = [
        { month: 'Jan', value: 45000, target: 50000 },
        { month: 'Feb', value: 52000, target: 50000 },
        { month: 'Mar', value: 48000, target: 50000 },
        { month: 'Apr', value: 61000, target: 55000 },
        { month: 'May', value: 55000, target: 55000 },
        { month: 'Jun', value: 67000, target: 60000 },
    ].slice(0, months);
    ResponseFormatter_1.ResponseFormatter.success(res, revenueData, 'Revenue data retrieved');
});
DashboardController.getSuperAdminPayroll = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_PAYROLL_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const payrollData = [
        { category: 'Salaries', value: 180000 },
        { category: 'Bonus', value: 35000 },
        { category: 'Benefits', value: 28000 },
        { category: 'Deductions', value: -12000 },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, payrollData, 'Payroll data retrieved');
});
DashboardController.getSuperAdminDepartments = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_DEPARTMENT_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const departments = [
        { name: 'Engineering', value: 65 },
        { name: 'Sales', value: 42 },
        { name: 'HR', value: 15 },
        { name: 'Finance', value: 28 },
        { name: 'Operations', value: 35 },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, departments, 'Department data retrieved');
});
DashboardController.getSuperAdminStudents = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_ENROLLMENT_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const studentData = {
        totalEnrolled: 1250,
        activeStudents: 1100,
        completedCourses: 450,
        droppedStudents: 50,
    };
    ResponseFormatter_1.ResponseFormatter.success(res, studentData, 'Student analytics retrieved');
});
DashboardController.getSuperAdminProjects = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_PROJECT_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const projects = [
        { name: 'Active Projects', value: 18 },
        { name: 'Completed', value: 45 },
        { name: 'On Hold', value: 3 },
        { name: 'Delayed', value: 2 },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, projects, 'Project data retrieved');
});
DashboardController.getSuperAdminCRM = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_OPPORTUNITY_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const crmData = {
        totalLeads: 324,
        totalOpportunities: 87,
        convertedDeals: 23,
        lostDeals: 12,
        conversionRate: 26.4,
    };
    ResponseFormatter_1.ResponseFormatter.success(res, crmData, 'CRM metrics retrieved');
});
DashboardController.getSuperAdminNotifications = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_NOTIFICATION_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const limit = parseInt(req.query.limit) || 5;
    const notifications = [
        { title: 'Payroll Processing', desc: 'Monthly payroll ready for approval', time: '2 hours ago' },
        { title: 'Leave Request', desc: '5 new leave requests pending approval', time: '4 hours ago' },
        { title: 'Project Milestone', desc: 'Website Redesign reached 80% completion', time: '6 hours ago' },
        { title: 'Attendance Alert', desc: '3 employees marked absent today', time: '8 hours ago' },
    ].slice(0, limit);
    ResponseFormatter_1.ResponseFormatter.success(res, notifications, 'Notifications retrieved');
});
DashboardController.getHeadOfAdminStats = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_STAFF_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const stats = {
        totalStaff: 142,
        pendingApprovals: 12,
        averageAttendance: 97.1,
        activeProjects: 8,
    };
    ResponseFormatter_1.ResponseFormatter.success(res, stats, 'Dashboard statistics retrieved');
});
DashboardController.getHeadOfAdminLeaveApprovals = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_LEAVE_REQUEST_APPROVE)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const approvals = [
        {
            id: '1',
            employee: 'Priya Sharma',
            type: 'Annual Leave',
            startDate: '2024-06-20',
            days: 5,
            status: 'pending',
        },
        {
            id: '2',
            employee: 'Raj Kumar',
            type: 'Sick Leave',
            startDate: '2024-06-18',
            days: 2,
            status: 'pending',
        },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, approvals, 'Leave approvals retrieved');
});
DashboardController.approveLeave = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_LEAVE_REQUEST_APPROVE)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const { leaveId } = req.params;
    const { remarks } = req.body;
    ResponseFormatter_1.ResponseFormatter.success(res, null, `Leave ${leaveId} approved successfully`);
});
DashboardController.rejectLeave = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_LEAVE_REQUEST_APPROVE)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const { leaveId } = req.params;
    const { reason } = req.body;
    ResponseFormatter_1.ResponseFormatter.success(res, null, `Leave ${leaveId} rejected successfully`);
});
DashboardController.getHeadOfAdminAttendanceReports = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_ATTENDANCE_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const reports = [
        { department: 'Engineering', present: 48, absent: 2, late: 3, rate: 95.2 },
        { department: 'Sales', present: 35, absent: 1, late: 2, rate: 96.1 },
        { department: 'HR', present: 12, absent: 0, late: 1, rate: 97.8 },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, reports, 'Attendance reports retrieved');
});
DashboardController.getHeadOfAdminDepartmentKPIs = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_DEPARTMENT_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const kpis = [
        { department: 'Engineering', target: 95, actual: 92, variance: -3 },
        { department: 'Sales', target: 90, actual: 88, variance: -2 },
        { department: 'HR', target: 98, actual: 97, variance: -1 },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, kpis, 'Department KPIs retrieved');
});
DashboardController.getHeadOfAdminProjects = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_PROJECT_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const projects = [
        { project: 'Website Redesign', status: 'In Progress', progress: 75 },
        { project: 'Mobile App', status: 'In Progress', progress: 60 },
        { project: 'CRM System', status: 'In Progress', progress: 85 },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, projects, 'Projects retrieved');
});
DashboardController.getHeadOfAdminCommunications = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_MESSAGE_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const limit = parseInt(req.query.limit) || 10;
    const comms = [
        { title: 'New HR Policy', author: 'HR Team', date: '2 hours ago', unread: true },
        { title: 'Q2 Results Overview', author: 'Management', date: '5 hours ago', unread: true },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, comms, 'Communications retrieved');
});
DashboardController.getHeadOfAdminLeaveSummary = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.user?.permissions.includes(permissions_1.PermissionCode.ORG_LEAVE_REQUEST_READ)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Insufficient permissions');
    }
    const summary = {
        pending: 12,
        approved: 45,
        rejected: 3,
        monthlyQuota: 100,
        utilized: 45,
    };
    ResponseFormatter_1.ResponseFormatter.success(res, summary, 'Leave summary retrieved');
});
exports.default = DashboardController;
//# sourceMappingURL=DashboardController.js.map