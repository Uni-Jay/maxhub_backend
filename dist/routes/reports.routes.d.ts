declare const router: import("express-serve-static-core").Router;
export declare function getAttendanceReportData(month: number, year: number): Promise<{
    records: {
        rate: string;
        status: string;
        name: string;
        dept: string;
        present: number;
        absent: number;
        late: number;
    }[];
    monthly: {
        month: string;
        present: number;
        absent: number;
        late: number;
    }[];
    departments: {
        dept: string;
        rate: number;
    }[];
}>;
export default router;
//# sourceMappingURL=reports.routes.d.ts.map