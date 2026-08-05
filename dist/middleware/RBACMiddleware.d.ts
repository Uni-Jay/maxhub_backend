import { Request, Response, NextFunction } from 'express';
import { PermissionCode } from '@config/PermissionCodes';
import { RBACService } from '@services/RBACService';
import { Sequelize } from 'sequelize';
export declare class RBACMiddleware {
    private rbacService;
    constructor(sequelize: Sequelize);
    requirePermission(permissionCode: PermissionCode): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requireAnyPermission(permissionCodes: PermissionCode[]): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requireAllPermissions(permissionCodes: PermissionCode[]): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    attachScopeFilter(permissionCode: PermissionCode): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    verifyResourceOwner(paramName?: string, ownerField?: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    verifyDepartmentAccess(departmentParamName?: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getRBACService(): RBACService;
}
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=RBACMiddleware.d.ts.map