import { Request, Response, NextFunction } from 'express';
import { PermissionCode } from '@config/PermissionCodes';
import { RBACService } from '@services/RBACService';
import { Sequelize } from 'sequelize';

/**
 * RBAC Middleware Factory
 * Creates middleware functions for permission checking on routes
 */
export class RBACMiddleware {
  private rbacService: RBACService;

  constructor(sequelize: Sequelize) {
    this.rbacService = new RBACService(sequelize);
  }

  /**
   * Middleware: Check if user has single permission
   * Usage: app.get('/resource', requirePermission(PermissionCode.RESOURCE_READ_ALL), handler)
   */
  requirePermission(permissionCode: PermissionCode) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized - User not authenticated',
            code: 'AUTH_REQUIRED',
          });
        }

        const hasPermission = await this.rbacService.hasPermission(
          BigInt(req.user.id),
          permissionCode
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden - Insufficient permissions',
            code: 'PERMISSION_DENIED',
            requiredPermission: permissionCode,
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error checking permissions',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };
  }

  /**
   * Middleware: Check if user has any of multiple permissions (OR logic)
   */
  requireAnyPermission(permissionCodes: PermissionCode[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized - User not authenticated',
            code: 'AUTH_REQUIRED',
          });
        }

        const hasPermission = await this.rbacService.hasAnyPermission(
          BigInt(req.user.id),
          permissionCodes
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden - Insufficient permissions',
            code: 'PERMISSION_DENIED',
            requiredPermissions: permissionCodes,
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error checking permissions',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };
  }

  /**
   * Middleware: Check if user has all of multiple permissions (AND logic)
   */
  requireAllPermissions(permissionCodes: PermissionCode[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized - User not authenticated',
            code: 'AUTH_REQUIRED',
          });
        }

        const hasPermission = await this.rbacService.hasAllPermissions(
          BigInt(req.user.id),
          permissionCodes
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden - All required permissions needed',
            code: 'PERMISSION_DENIED',
            requiredPermissions: permissionCodes,
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error checking permissions',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };
  }

  /**
   * Middleware: Attach user scope to request for filtered queries
   */
  attachScopeFilter(permissionCode: PermissionCode) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized - User not authenticated',
            code: 'AUTH_REQUIRED',
          });
        }

        const scope = await this.rbacService.getScopeFilter(
          BigInt(req.user.id),
          permissionCode
        );
        (req as any).scope = scope;
        (req as any).userDepartmentId = req.user.departmentId;

        next();
      } catch (error) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden - No applicable scope for this resource',
          code: 'SCOPE_DENIED',
        });
      }
    };
  }

  /**
   * Middleware: Verify user owns resource before allowing action
   * Usage: app.delete('/resource/:id', verifyResourceOwner('id', 'createdById'), handler)
   */
  verifyResourceOwner(paramName: string = 'id', ownerField: string = 'createdById') {
    return async (req: Request, res: Response, next: NextFunction) => {
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

        // Store for use in handler
        (req as any).resourceId = resourceId;
        (req as any).verifyOwner = async (resource: any) => {
          return resource?.[ownerField] === req.user?.id;
        };

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error verifying resource ownership',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };
  }

  /**
   * Middleware: Verify user is in same department as resource
   */
  verifyDepartmentAccess(departmentParamName: string = 'departmentId') {
    return async (req: Request, res: Response, next: NextFunction) => {
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
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error verifying department access',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };
  }

  /**
   * Get RBAC Service instance for use in handlers
   */
  getRBACService(): RBACService {
    return this.rbacService;
  }
}

/**
 * Middleware: Ensure user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - User not authenticated',
      code: 'AUTH_REQUIRED',
    });
  }
  next();
};
