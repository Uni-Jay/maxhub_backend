import { Sequelize } from 'sequelize';
import { PermissionCode } from '@config/PermissionCodes';
import { ROLE_PERMISSIONS, RoleCode, ROLE_HIERARCHY } from '@config/RolesConfig';

/**
 * RBAC Service - Permission and Role Management
 * Handles permission checking, role hierarchy, and scope-based filtering
 */
export class RBACService {
  constructor(private sequelize: Sequelize) {}

  /**
   * Check if user has permission
   * @param userId User ID
   * @param permissionCode Permission code to check
   * @param scope Scope context (all, own, own_department)
   * @returns true if user has permission
   */
  async hasPermission(userId: bigint, permissionCode: PermissionCode, scope?: string): Promise<boolean> {
    try {
      // Get user's roles
      const userRoles = await this.getUserRoles(userId);

      if (!userRoles || userRoles.length === 0) {
        return false;
      }

      // Check if any role has permission
      for (const roleCode of userRoles) {
        if (this.roleHasPermission(roleCode, permissionCode)) {
          return true;
        }
      }

      // Check user-specific permissions override
      const userPermissions = await this.getUserDirectPermissions(userId);
      return userPermissions.includes(permissionCode);
    } catch (error) {
      console.error(`Error checking permission ${permissionCode} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has any of the provided permissions
   */
  async hasAnyPermission(userId: bigint, permissionCodes: PermissionCode[]): Promise<boolean> {
    for (const permissionCode of permissionCodes) {
      if (await this.hasPermission(userId, permissionCode)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of the provided permissions
   */
  async hasAllPermissions(userId: bigint, permissionCodes: PermissionCode[]): Promise<boolean> {
    for (const permissionCode of permissionCodes) {
      if (!(await this.hasPermission(userId, permissionCode))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get scope filter for queries based on user's scope permission
   * @param userId User ID
   * @param permissionCode Permission code
   * @returns Scope filter: 'all', 'own', or 'own_department'
   */
  async getScopeFilter(userId: bigint, permissionCode: PermissionCode): Promise<'all' | 'own' | 'own_department'> {
    try {
      // Try 'all' scope first (highest privilege)
      const allScopePermission = permissionCode.replace('.all', '.all');
      if (await this.hasPermission(userId, allScopePermission as PermissionCode)) {
        return 'all';
      }

      // Try 'own_department' scope
      const deptScopePermission = permissionCode.replace('.all', '.own_department');
      if (await this.hasPermission(userId, deptScopePermission as PermissionCode)) {
        return 'own_department';
      }

      // Try 'own' scope
      const ownScopePermission = permissionCode.replace('.all', '.own');
      if (await this.hasPermission(userId, ownScopePermission as PermissionCode)) {
        return 'own';
      }

      // No permission
      throw new Error(`No read permission scope found for ${permissionCode}`);
    } catch (error) {
      console.error(`Error getting scope filter:`, error);
      throw error;
    }
  }

  /**
   * Verify role hierarchy - check if user's role is >= required role level
   */
  async hasMinimumRole(userId: bigint, requiredRole: RoleCode): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId);
      const requiredLevel = ROLE_HIERARCHY[requiredRole];

      for (const roleCode of userRoles) {
        const userLevel = ROLE_HIERARCHY[roleCode as RoleCode];
        if (userLevel >= requiredLevel) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`Error checking minimum role:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a user (from roles + direct)
   */
  async getUserAllPermissions(userId: bigint): Promise<PermissionCode[]> {
    try {
      const userRoles = await this.getUserRoles(userId);
      const permissions = new Set<PermissionCode>();

      // Add role-based permissions
      for (const roleCode of userRoles) {
        const rolePerms = ROLE_PERMISSIONS[roleCode as RoleCode] || [];
        rolePerms.forEach(perm => permissions.add(perm));
      }

      // Add direct user permissions
      const directPerms = await this.getUserDirectPermissions(userId);
      directPerms.forEach(perm => permissions.add(perm));

      return Array.from(permissions);
    } catch (error) {
      console.error(`Error getting user permissions:`, error);
      return [];
    }
  }

  /**
   * Get user's roles (from database)
   * @internal
   */
  private async getUserRoles(userId: bigint): Promise<RoleCode[]> {
    try {
      const query = `
        SELECT DISTINCT r.roleCode FROM user_roles ur
        JOIN roles r ON ur.roleId = r.id
        WHERE ur.userId = ? AND ur.deletedAt IS NULL
      `;
      const results = await this.sequelize.query(query, {
        replacements: [userId],
        type: 'SELECT',
      });

      return (results as any[]).map(row => row.roleCode);
    } catch (error) {
      console.error(`Error fetching user roles:`, error);
      return [];
    }
  }

  /**
   * Get user's direct permissions override (from database)
   * @internal
   */
  private async getUserDirectPermissions(userId: bigint): Promise<PermissionCode[]> {
    try {
      const query = `
        SELECT DISTINCT p.permissionCode FROM user_permissions up
        JOIN permissions p ON up.permissionId = p.id
        WHERE up.userId = ? AND up.deletedAt IS NULL
      `;
      const results = await this.sequelize.query(query, {
        replacements: [userId],
        type: 'SELECT',
      });

      return (results as any[]).map(row => row.permissionCode);
    } catch (error) {
      console.error(`Error fetching user permissions:`, error);
      return [];
    }
  }

  /**
   * Check if role has permission (from config, no database lookup)
   * @internal
   */
  private roleHasPermission(roleCode: RoleCode, permissionCode: PermissionCode): boolean {
    const rolePerms = ROLE_PERMISSIONS[roleCode];
    return rolePerms ? rolePerms.includes(permissionCode) : false;
  }

  /**
   * Get all permissions available in system
   */
  getAllPermissions(): PermissionCode[] {
    return Object.values(PermissionCode);
  }

  /**
   * Get all roles
   */
  getAllRoles(): RoleCode[] {
    return Object.values(RoleCode);
  }

  /**
   * Get role permissions from config
   */
  getRolePermissions(roleCode: RoleCode): PermissionCode[] {
    return ROLE_PERMISSIONS[roleCode] || [];
  }

  /**
   * Get role hierarchy level
   */
  getRoleLevel(roleCode: RoleCode): number {
    return ROLE_HIERARCHY[roleCode] || 0;
  }

  /**
   * Check if user can perform action on resource
   * Checks: user must have permission AND user must own resource or have scope permission
   */
  async canPerformAction(
    userId: bigint,
    permissionCode: PermissionCode,
    resourceOwnerId?: bigint,
    resourceDepartmentId?: bigint,
    userDepartmentId?: bigint
  ): Promise<boolean> {
    try {
      // First check if user has permission
      if (!(await this.hasPermission(userId, permissionCode))) {
        return false;
      }

      // Extract scope from permission (all, own, own_department)
      const scope = this.extractScope(permissionCode);

      // If 'all' scope, user can perform action
      if (scope === 'all') {
        return true;
      }

      // If 'own' scope, check if user is resource owner
      if (scope === 'own') {
        return userId === resourceOwnerId;
      }

      // If 'own_department' scope, check if user is in same department
      if (scope === 'own_department') {
        return userDepartmentId === resourceDepartmentId;
      }

      return false;
    } catch (error) {
      console.error(`Error checking action permission:`, error);
      return false;
    }
  }

  /**
   * Extract scope from permission code
   * @internal
   */
  private extractScope(permissionCode: PermissionCode): 'all' | 'own' | 'own_department' {
    if (permissionCode.endsWith('.all')) return 'all';
    if (permissionCode.endsWith('.own_department')) return 'own_department';
    if (permissionCode.endsWith('.own')) return 'own';
    return 'own'; // default
  }

  /**
   * Create SQL WHERE clause based on scope
   */
  getScopeWhereClause(
    scope: 'all' | 'own' | 'own_department',
    userId: bigint,
    userDepartmentId?: bigint,
    ownFields?: { owner: string; department: string }
  ): { where: any; parameters: any[] } {
    const defaultOwnerField = ownFields?.owner || 'createdById';
    const defaultDeptField = ownFields?.department || 'departmentId';

    if (scope === 'all') {
      return { where: '1=1', parameters: [] };
    }

    if (scope === 'own') {
      return { where: `${defaultOwnerField} = ?`, parameters: [userId] };
    }

    if (scope === 'own_department') {
      return {
        where: `${defaultDeptField} = ?`,
        parameters: [userDepartmentId],
      };
    }

    return { where: '1=1', parameters: [] };
  }
}
