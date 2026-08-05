import { Sequelize } from 'sequelize';
import { PermissionCode } from '@config/PermissionCodes';
import { RoleCode } from '@config/RolesConfig';
export declare class RBACService {
    private sequelize;
    constructor(sequelize: Sequelize);
    hasPermission(userId: bigint, permissionCode: PermissionCode, scope?: string): Promise<boolean>;
    hasAnyPermission(userId: bigint, permissionCodes: PermissionCode[]): Promise<boolean>;
    hasAllPermissions(userId: bigint, permissionCodes: PermissionCode[]): Promise<boolean>;
    getScopeFilter(userId: bigint, permissionCode: PermissionCode): Promise<'all' | 'own' | 'own_department'>;
    hasMinimumRole(userId: bigint, requiredRole: RoleCode): Promise<boolean>;
    getUserAllPermissions(userId: bigint): Promise<PermissionCode[]>;
    private getUserRoles;
    private getUserDirectPermissions;
    private roleHasPermission;
    getAllPermissions(): PermissionCode[];
    getAllRoles(): RoleCode[];
    getRolePermissions(roleCode: RoleCode): PermissionCode[];
    getRoleLevel(roleCode: RoleCode): number;
    canPerformAction(userId: bigint, permissionCode: PermissionCode, resourceOwnerId?: bigint, resourceDepartmentId?: bigint, userDepartmentId?: bigint): Promise<boolean>;
    private extractScope;
    getScopeWhereClause(scope: 'all' | 'own' | 'own_department', userId: bigint, userDepartmentId?: bigint, ownFields?: {
        owner: string;
        department: string;
    }): {
        where: any;
        parameters: any[];
    };
}
//# sourceMappingURL=RBACService.d.ts.map