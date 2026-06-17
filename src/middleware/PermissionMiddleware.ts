import { Request, Response, NextFunction } from 'express';
import { UserModulePermission } from '@models/UserModulePermission.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';

type ModuleAction = 'view' | 'create' | 'edit' | 'delete';

/**
 * checkPermission — 4-tier permission priority:
 *   1. SUPERADMIN  → full access always
 *   2. UserModulePermission override → explicit allow or hard-deny for this user+module
 *   3. Role-based permission in JWT   → fallback check via permissions[] array
 *   4. Deny
 */
export const checkPermission = (moduleCode: string, action: ModuleAction) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      ResponseFormatter.unauthorized(res, 'Authentication required', req.path);
      return;
    }

    // 1. Superadmin bypass
    if ((req.user.roles || []).includes('superadmin')) {
      return next();
    }

    // 2. Custom UserModulePermission override
    const override = await UserModulePermission.findOne({
      where: { userId: req.user.id, moduleCode },
    }).catch(() => null);

    if (override) {
      const permitted =
        action === 'view'   ? override.canView :
        action === 'create' ? override.canCreate :
        action === 'edit'   ? override.canEdit :
        action === 'delete' ? override.canDelete : false;

      if (permitted) return next();
      ResponseFormatter.forbidden(res, `Module access denied: ${moduleCode}`, req.path);
      return;
    }

    // 3. Role-based permission fallback
    const permPrefix = moduleCode.toLowerCase() + '.';
    const readAliases = ['view', 'read', 'list', 'get'];
    const actionAliases = action === 'view' ? readAliases : [action];
    const userPerms = (req.user.permissions || []).map((p: string) => p.toLowerCase());

    const hasRolePerm = userPerms.some((p: string) =>
      p.startsWith(permPrefix) && actionAliases.some((a) => p.includes(a))
    );

    if (hasRolePerm) return next();

    // 4. Deny
    ResponseFormatter.forbidden(res, `Permission denied: ${moduleCode}.${action}`, req.path);
  };
};
