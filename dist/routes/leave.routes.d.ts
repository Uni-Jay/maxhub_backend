declare const router: import("express-serve-static-core").Router;
export declare function getLeaveBalance(staffId?: number): Promise<{
    total: number;
    used: number;
    available: number;
    leaveTypes: {
        totalDays: number;
        usedDays: number;
        remainingDays: number;
    }[];
}>;
export default router;
//# sourceMappingURL=leave.routes.d.ts.map