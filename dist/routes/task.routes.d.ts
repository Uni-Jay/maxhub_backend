import { Request } from 'express';
declare const router: import("express-serve-static-core").Router;
export declare function getPendingTasksSummary(req: Request): Promise<{
    scope: import("@utils/RoleBucket").RoleBucket;
    total: number;
    tasks: {
        title: string;
        status: "Cancelled" | "InProgress" | "Todo" | "InReview" | "Blocked" | "Done";
        priority: "Low" | "Medium" | "High" | "Critical";
        dueDate: Date | undefined;
        dueToday: boolean;
        overdue: boolean;
        project: any;
        assignee: string | undefined;
    }[];
}>;
export default router;
//# sourceMappingURL=task.routes.d.ts.map