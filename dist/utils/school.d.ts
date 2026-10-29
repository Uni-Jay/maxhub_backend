export declare const SCHOOL_DEPARTMENT_CODES: Record<string, string[]>;
export declare function normaliseSchool(v: any): 'KS' | 'BM' | null;
export declare function schoolDepartmentIds(school: any): Promise<number[] | null>;
export declare function schoolOfDepartment(departmentId: any): Promise<'KS' | 'BM' | null>;
export declare function schoolDefaultDepartmentId(school: any): Promise<number | null>;
//# sourceMappingURL=school.d.ts.map