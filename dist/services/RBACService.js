"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
const PermissionCodes_1 = require("@config/PermissionCodes");
const RolesConfig_1 = require("@config/RolesConfig");
class RBACService {
    constructor(sequelize) {
        this.sequelize = sequelize;
    }
    async hasPermission(userId, permissionCode, scope) {
        try {
            const userRoles = await this.getUserRoles(userId);
            if (!userRoles || userRoles.length === 0) {
                return false;
            }
            for (const roleCode of userRoles) {
                if (this.roleHasPermission(roleCode, permissionCode)) {
                    return true;
                }
            }
            const userPermissions = await this.getUserDirectPermissions(userId);
            return userPermissions.includes(permissionCode);
        }
        catch (error) {
            console.error(`Error checking permission ${permissionCode} for user ${userId}:`, error);
            return false;
        }
    }
    async hasAnyPermission(userId, permissionCodes) {
        for (const permissionCode of permissionCodes) {
            if (await this.hasPermission(userId, permissionCode)) {
                return true;
            }
        }
        return false;
    }
    async hasAllPermissions(userId, permissionCodes) {
        for (const permissionCode of permissionCodes) {
            if (!(await this.hasPermission(userId, permissionCode))) {
                return false;
            }
        }
        return true;
    }
    async getScopeFilter(userId, permissionCode) {
        try {
            const allScopePermission = permissionCode.replace('.all', '.all');
            if (await this.hasPermission(userId, allScopePermission)) {
                return 'all';
            }
            const deptScopePermission = permissionCode.replace('.all', '.own_department');
            if (await this.hasPermission(userId, deptScopePermission)) {
                return 'own_department';
            }
            const ownScopePermission = permissionCode.replace('.all', '.own');
            if (await this.hasPermission(userId, ownScopePermission)) {
                return 'own';
            }
            throw new Error(`No read permission scope found for ${permissionCode}`);
        }
        catch (error) {
            console.error(`Error getting scope filter:`, error);
            throw error;
        }
    }
    async hasMinimumRole(userId, requiredRole) {
        try {
            const userRoles = await this.getUserRoles(userId);
            const requiredLevel = RolesConfig_1.ROLE_HIERARCHY[requiredRole];
            for (const roleCode of userRoles) {
                const userLevel = RolesConfig_1.ROLE_HIERARCHY[roleCode];
                if (userLevel >= requiredLevel) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error(`Error checking minimum role:`, error);
            return false;
        }
    }
    async getUserAllPermissions(userId) {
        try {
            const userRoles = await this.getUserRoles(userId);
            const permissions = new Set();
            for (const roleCode of userRoles) {
                const rolePerms = RolesConfig_1.ROLE_PERMISSIONS[roleCode] || [];
                rolePerms.forEach(perm => permissions.add(perm));
            }
            const directPerms = await this.getUserDirectPermissions(userId);
            directPerms.forEach(perm => permissions.add(perm));
            return Array.from(permissions);
        }
        catch (error) {
            console.error(`Error getting user permissions:`, error);
            return [];
        }
    }
    async getUserRoles(userId) {
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
            return results.map(row => row.roleCode);
        }
        catch (error) {
            console.error(`Error fetching user roles:`, error);
            return [];
        }
    }
    async getUserDirectPermissions(userId) {
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
            return results.map(row => row.permissionCode);
        }
        catch (error) {
            console.error(`Error fetching user permissions:`, error);
            return [];
        }
    }
    roleHasPermission(roleCode, permissionCode) {
        const rolePerms = RolesConfig_1.ROLE_PERMISSIONS[roleCode];
        return rolePerms ? rolePerms.includes(permissionCode) : false;
    }
    getAllPermissions() {
        return Object.values(PermissionCodes_1.PermissionCode);
    }
    getAllRoles() {
        return Object.values(RolesConfig_1.RoleCode);
    }
    getRolePermissions(roleCode) {
        return RolesConfig_1.ROLE_PERMISSIONS[roleCode] || [];
    }
    getRoleLevel(roleCode) {
        return RolesConfig_1.ROLE_HIERARCHY[roleCode] || 0;
    }
    async canPerformAction(userId, permissionCode, resourceOwnerId, resourceDepartmentId, userDepartmentId) {
        try {
            if (!(await this.hasPermission(userId, permissionCode))) {
                return false;
            }
            const scope = this.extractScope(permissionCode);
            if (scope === 'all') {
                return true;
            }
            if (scope === 'own') {
                return userId === resourceOwnerId;
            }
            if (scope === 'own_department') {
                return userDepartmentId === resourceDepartmentId;
            }
            return false;
        }
        catch (error) {
            console.error(`Error checking action permission:`, error);
            return false;
        }
    }
    extractScope(permissionCode) {
        if (permissionCode.endsWith('.all'))
            return 'all';
        if (permissionCode.endsWith('.own_department'))
            return 'own_department';
        if (permissionCode.endsWith('.own'))
            return 'own';
        return 'own';
    }
    getScopeWhereClause(scope, userId, userDepartmentId, ownFields) {
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
exports.RBACService = RBACService;
//# sourceMappingURL=RBACService.js.map