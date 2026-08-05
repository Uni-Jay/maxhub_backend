"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const UserModulePermission_model_1 = require("@models/UserModulePermission.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const checkPermission = (moduleCode, action) => {
    return async (req, res, next) => {
        if (!req.user) {
            ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required', req.path);
            return;
        }
        if ((req.user.roles || []).includes('superadmin')) {
            return next();
        }
        const override = await UserModulePermission_model_1.UserModulePermission.findOne({
            where: { userId: req.user.id, moduleCode },
        }).catch(() => null);
        if (override) {
            const permitted = action === 'view' ? override.canView :
                action === 'create' ? override.canCreate :
                    action === 'edit' ? override.canEdit :
                        action === 'delete' ? override.canDelete : false;
            if (permitted)
                return next();
            ResponseFormatter_1.ResponseFormatter.forbidden(res, `Module access denied: ${moduleCode}`, req.path);
            return;
        }
        const permPrefix = moduleCode.toLowerCase() + '.';
        const readAliases = ['view', 'read', 'list', 'get'];
        const actionAliases = action === 'view' ? readAliases : [action];
        const userPerms = (req.user.permissions || []).map((p) => p.toLowerCase());
        const hasRolePerm = userPerms.some((p) => p.startsWith(permPrefix) && actionAliases.some((a) => p.includes(a)));
        if (hasRolePerm)
            return next();
        ResponseFormatter_1.ResponseFormatter.forbidden(res, `Permission denied: ${moduleCode}.${action}`, req.path);
    };
};
exports.checkPermission = checkPermission;
//# sourceMappingURL=PermissionMiddleware.js.map