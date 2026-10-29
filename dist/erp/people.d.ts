import { Router } from 'express';
export declare function money(n: any, currency?: string): string;
export declare function brandDepartments(): Promise<Array<{
    id: number;
    code: string;
    name: string;
    headUserId: number | null;
    displayName: string;
    logoUrl: string | null;
    primaryColor: string | null;
    tagline: string | null;
}>>;
export declare function brandOfDepartment(departmentId: any): Promise<number | null>;
export declare function ensureStaffInAllBrands(staffId: number): Promise<void>;
export declare function ensureAllStaffInAllBrands(): Promise<number>;
export declare function staffBrands(staffId: number): Promise<{
    staffId: number;
    userId: number | null;
    primaryDepartmentId: number | null;
    brands: {
        departmentId: number;
        code: string;
        name: string;
        logoUrl: string | null;
        color: string | null;
        isPrimary: boolean;
        isHead: boolean;
        units: any[];
    }[];
} | null>;
export declare function sendStaffWelcome(staffId: number, opts?: {
    temporaryPassword?: string;
}): Promise<boolean>;
export declare function peopleRouter(): Router;
//# sourceMappingURL=people.d.ts.map