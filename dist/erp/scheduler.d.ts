export declare function lastFriday(from?: Date): string;
export declare function buildWeeklySummary(weekStart?: Date): Promise<{
    period: {
        start: Date;
        end: Date;
    };
    brands: any[];
    hr: {
        weekEnding: string;
        weeklyReportsMissing: string[];
        weeklyReportsSubmitted: number;
        pendingLeave: number;
        newApplicants: number;
    };
}>;
export declare function startErpScheduler(): void;
//# sourceMappingURL=scheduler.d.ts.map