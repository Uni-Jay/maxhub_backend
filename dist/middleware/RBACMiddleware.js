"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.RBACMiddleware = void 0;
const RBACService_1 = require("@services/RBACService");
class RBACMiddleware {
    constructor(sequelize) {
        this.rbacService = new RBACService_1.RBACService(sequelize);
    }
    requirePermission(permissionCode) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized - User not authenticated',
                        code: 'AUTH_REQUIRED',
                    });
                }
                const hasPermission = await this.rbacService.hasPermission(BigInt(req.user.id), permissionCode);
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden - Insufficient permissions',
                        code: 'PERMISSION_DENIED',
                        requiredPermission: permissionCode,
                    });
                }
                next();
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error checking permissions',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
    }
    requireAnyPermission(permissionCodes) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized - User not authenticated',
                        code: 'AUTH_REQUIRED',
                    });
                }
                const hasPermission = await this.rbacService.hasAnyPermission(BigInt(req.user.id), permissionCodes);
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden - Insufficient permissions',
                        code: 'PERMISSION_DENIED',
                        requiredPermissions: permissionCodes,
                    });
                }
                next();
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error checking permissions',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
    }
    requireAllPermissions(permissionCodes) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized - User not authenticated',
                        code: 'AUTH_REQUIRED',
                    });
                }
                const hasPermission = await this.rbacService.hasAllPermissions(BigInt(req.user.id), permissionCodes);
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden - All required permissions needed',
                        code: 'PERMISSION_DENIED',
                        requiredPermissions: permissionCodes,
                    });
                }
                next();
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error checking permissions',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
    }
    attachScopeFilter(permissionCode) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized - User not authenticated',
                        code: 'AUTH_REQUIRED',
                    });
                }
                const scope = await this.rbacService.getScopeFilter(BigInt(req.user.id), permissionCode);
                req.scope = scope;
                req.userDepartmentId = req.user.departmentId;
                next();
            }
            catch (error) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden - No applicable scope for this resource',
                    code: 'SCOPE_DENIED',
                });
            }
        };
    }
    verifyResourceOwner(paramName = 'id', ownerField = 'createdById') {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized - User not authenticated',
                        code: 'AUTH_REQUIRED',
                    });
                }
                const resourceId = req.params[paramName];
                if (!resourceId) {
                    return res.status(400).json({
                        success: false,
                        message: `Missing resource ID parameter: ${paramName}`,
                    });
                }
                req.resourceId = resourceId;
                req.verifyOwner = async (resource) => {
                    return resource?.[ownerField] === req.user?.id;
                };
                next();
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error verifying resource ownership',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
    }
    verifyDepartmentAccess(departmentParamName = 'departmentId') {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized - User not authenticated',
                        code: 'AUTH_REQUIRED',
                    });
                }
                const resourceDeptId = req.params[departmentParamName] || req.body?.departmentId;
                if (!resourceDeptId) {
                    return res.status(400).json({
                        success: false,
                        message: `Missing department ID parameter: ${departmentParamName}`,
                    });
                }
                if (BigInt(resourceDeptId) !== BigInt(req.user.departmentId)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden - Cross-department access not allowed',
                        code: 'DEPARTMENT_MISMATCH',
                    });
                }
                next();
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error verifying department access',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
    }
    getRBACService() {
        return this.rbacService;
    }
}
exports.RBACMiddleware = RBACMiddleware;
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - User not authenticated',
            code: 'AUTH_REQUIRED',
        });
    }
    next();
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=RBACMiddleware.js.map