import { Request } from 'express';
import { BaseService } from './BaseService';
export declare class DashboardService extends BaseService {
    getStaffDashboard(req: Request, staffId: bigint): Promise<{
        tasks: {
            totalTasks: number;
            pendingTasks: never[];
            inProgressTasks: never[];
            completedTasks: never[];
            overdueTasks: never[];
        };
        attendance: {
            presentDays: number;
            absentDays: number;
            lateDays: number;
            halfDays: number;
            onLeaveDays: number;
            thisMonthHours: number;
            overtimeHours: number;
        };
        messages: {
            unreadCount: number;
            conversations: never[];
            recentMessages: never[];
        };
        payslips: {
            totalPayslips: number;
            upcomingPayslipDate: null;
            recentPayslips: never[];
        };
        leaveRequests: {
            pendingRequests: never[];
            approvedRequests: never[];
            balances: {};
        };
        calendar: {
            holidays: never[];
            events: never[];
            tasks: never[];
            meetings: never[];
        };
    }>;
    getPersonalTasks(staffId: bigint): Promise<{
        totalTasks: number;
        pendingTasks: never[];
        inProgressTasks: never[];
        completedTasks: never[];
        overdueTasks: never[];
    }>;
    getPersonalAttendance(staffId: bigint): Promise<{
        presentDays: number;
        absentDays: number;
        lateDays: number;
        halfDays: number;
        onLeaveDays: number;
        thisMonthHours: number;
        overtimeHours: number;
    }>;
    getUnreadMessages(staffId: bigint): Promise<{
        unreadCount: number;
        conversations: never[];
        recentMessages: never[];
    }>;
    getRecentPayslips(staffId: bigint): Promise<{
        totalPayslips: number;
        upcomingPayslipDate: null;
        recentPayslips: never[];
    }>;
    getLeaveRequests(staffId: bigint): Promise<{
        pendingRequests: never[];
        approvedRequests: never[];
        balances: {};
    }>;
    getCalendarEvents(staffId: bigint): Promise<{
        holidays: never[];
        events: never[];
        tasks: never[];
        meetings: never[];
    }>;
}
//# sourceMappingURL=DashboardService.d.ts.map