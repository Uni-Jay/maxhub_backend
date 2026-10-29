import { Router, Request } from 'express';
export declare function startOnboarding(staffId: number, req?: Request | null): Promise<number>;
export declare const CRITERIA: {
    key: string;
    label: string;
    hint: string;
}[];
export declare function buildEvidence(staffId: number, from: string, to: string): Promise<{
    period: {
        from: string;
        to: string;
        weeks: number;
    };
    tasks: {
        total: number;
        done: number;
        onTime: number;
        overdue: number;
        blocked: number;
    };
    weeklyReports: {
        submitted: number;
        expected: number;
        approved: number;
    };
    attendance: {
        present: number;
        late: number;
        absent: number;
    };
    leaveDays: number;
    brandJobs: Record<string, any>;
    receiptsIssued: number;
    customerReports: number;
    generatedAt: string;
}>;
export declare function developmentRouter(): Router;
//# sourceMappingURL=development.d.ts.map