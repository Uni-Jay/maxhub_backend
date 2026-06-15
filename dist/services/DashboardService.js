"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const BaseService_1 = require("./BaseService");
const PermissionCodes_1 = require("../config/PermissionCodes");
class DashboardService extends BaseService_1.BaseService {
    async getStaffDashboard(req, staffId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.DASHBOARD_STAFF_READ_OWN);
        const [tasks, attendance, messages, payslips, leaveRequests, personalCalendar] = await Promise.all([
            this.getPersonalTasks(staffId),
            this.getPersonalAttendance(staffId),
            this.getUnreadMessages(staffId),
            this.getRecentPayslips(staffId),
            this.getLeaveRequests(staffId),
            this.getCalendarEvents(staffId),
        ]);
        return {
            tasks,
            attendance,
            messages,
            payslips,
            leaveRequests,
            calendar: personalCalendar,
        };
    }
    async getPersonalTasks(staffId) {
        return {
            totalTasks: 0,
            pendingTasks: [],
            inProgressTasks: [],
            completedTasks: [],
            overdueTasks: [],
        };
    }
    async getPersonalAttendance(staffId) {
        return {
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            halfDays: 0,
            onLeaveDays: 0,
            thisMonthHours: 0,
            overtimeHours: 0,
        };
    }
    async getUnreadMessages(staffId) {
        return {
            unreadCount: 0,
            conversations: [],
            recentMessages: [],
        };
    }
    async getRecentPayslips(staffId) {
        return {
            totalPayslips: 0,
            upcomingPayslipDate: null,
            recentPayslips: [],
        };
    }
    async getLeaveRequests(staffId) {
        return {
            pendingRequests: [],
            approvedRequests: [],
            balances: {},
        };
    }
    async getCalendarEvents(staffId) {
        return {
            holidays: [],
            events: [],
            tasks: [],
            meetings: [],
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=DashboardService.js.map