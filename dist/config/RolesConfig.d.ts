import { PermissionCode } from './PermissionCodes';
export declare enum RoleCode {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD",
    MANAGER = "MANAGER",
    SUPERVISOR = "SUPERVISOR",
    TEAM_LEAD = "TEAM_LEAD",
    STAFF = "STAFF",
    CONSULTANT = "CONSULTANT",
    INTERN = "INTERN"
}
export declare const ROLE_DESCRIPTIONS: Record<RoleCode, string>;
export declare const ROLE_HIERARCHY: Record<RoleCode, number>;
export declare const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]>;
//# sourceMappingURL=RolesConfig.d.ts.map