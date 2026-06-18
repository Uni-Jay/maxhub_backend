declare const router: import("express-serve-static-core").Router;
export declare function getPayrollOverview(): Promise<{
    currentPeriod: {
        id: bigint;
        periodCode: string;
        status: "Approved" | "Draft" | "Closed" | "Processing" | "Processed" | "Transferred";
    } | null;
    currentMonth: {
        headcount: number;
        totalGross: number;
        totalNet: number;
        totalDeductions: number;
        avgNet: number;
    };
    activeHeadcount: number;
    yearToDate: {
        ytdNet: number;
        ytdGross: number;
    };
    statusSummary: Record<string, number>;
}>;
export default router;
//# sourceMappingURL=payroll.routes.d.ts.map