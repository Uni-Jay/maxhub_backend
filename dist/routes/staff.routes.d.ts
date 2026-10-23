import { Staff } from '../models/Staff.model';
declare const router: import("express-serve-static-core").Router;
export declare function searchStaff(filters: {
    search?: string;
    status?: string;
    departmentId?: string | number;
    branchId?: string | number;
    unitId?: string | number;
    limit?: number;
    offset?: number;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
}): Promise<{
    rows: Staff[];
    count: number;
}>;
export default router;
//# sourceMappingURL=staff.routes.d.ts.map