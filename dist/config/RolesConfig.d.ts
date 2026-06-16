import { PermissionCode } from './PermissionCodes';
export declare enum RoleCode {
    SUPERADMIN = "superadmin",
    ADMIN = "admin",
    HR = "hr",
    HOD = "hod",
    STAFF = "staff",
    STUDENT = "student"
}
export declare const ROLE_DESCRIPTIONS: Record<RoleCode, string>;
export declare const ROLE_HIERARCHY: Record<RoleCode, number>;
export declare const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]>;
//# sourceMappingURL=RolesConfig.d.ts.map