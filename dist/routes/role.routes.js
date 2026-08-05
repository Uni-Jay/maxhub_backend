"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const idOrUuid_1 = require("@utils/idOrUuid");
const uuid_1 = require("uuid");
const Role_model_1 = require("@models/Role.model");
const Permission_model_1 = require("@models/Permission.model");
const RolePermission_model_1 = require("@models/RolePermission.model");
const UserRole_model_1 = require("@models/UserRole.model");
const User_model_1 = require("@models/User.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.use(AuthMiddleware_1.default.requireRole('superadmin'));
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const roles = await Role_model_1.Role.findAll({
        order: [['isSystemRole', 'DESC'], ['name', 'ASC']],
    });
    const rolesWithCount = await Promise.all(roles.map(async (role) => {
        const [permCount, userCount] = await Promise.all([
            RolePermission_model_1.RolePermission.count({ where: { roleId: role.id } }),
            UserRole_model_1.UserRole.count({ where: { roleId: role.id } }),
        ]);
        return { ...role.toJSON(), permissionCount: permCount, userCount };
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, rolesWithCount);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const role = await Role_model_1.Role.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!role)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Role not found', 404);
    const permissions = await Permission_model_1.Permission.findAll({
        include: [{ model: RolePermission_model_1.RolePermission, as: 'rolePermissions', where: { roleId: role.id }, required: true }],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...role.toJSON(), permissions });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('RBAC.ROLE.CREATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { code, name, description } = req.body;
    if (!code || !name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'code and name are required', 400);
    const existing = await Role_model_1.Role.findOne({ where: { code } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Role code already exists', 409);
    const role = await Role_model_1.Role.create({
        uuid: (0, uuid_1.v4)(), code, name, description,
        isSystemRole: false, isActive: true,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, role, 'Role created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('RBAC.ROLE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const role = await Role_model_1.Role.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!role)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Role not found', 404);
    if (role.isSystemRole)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Cannot edit system roles', 403);
    const { name, description, isActive } = req.body;
    await role.update({ name, description, isActive });
    ResponseFormatter_1.ResponseFormatter.success(res, role, 'Role updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('RBAC.ROLE.DELETE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const role = await Role_model_1.Role.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!role)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Role not found', 404);
    if (role.isSystemRole)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Cannot delete system roles', 403);
    const userCount = await UserRole_model_1.UserRole.count({ where: { roleId: role.id } });
    if (userCount > 0)
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot delete role with ${userCount} active users`, 400);
    await role.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Role deleted');
}));
router.post('/:id/permissions', AuthMiddleware_1.default.requirePermission('RBAC.ROLE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const role = await Role_model_1.Role.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!role)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Role not found', 404);
    const { permissionIds } = req.body;
    if (!Array.isArray(permissionIds))
        return ResponseFormatter_1.ResponseFormatter.error(res, 'permissionIds array required', 400);
    await Promise.all(permissionIds.map((pid) => RolePermission_model_1.RolePermission.findOrCreate({
        where: { roleId: role.id, permissionId: pid },
        defaults: { roleId: role.id, permissionId: pid },
    })));
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Permissions assigned');
}));
router.delete('/:id/permissions/:permissionId', AuthMiddleware_1.default.requirePermission('RBAC.ROLE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const role = await Role_model_1.Role.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!role)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Role not found', 404);
    await RolePermission_model_1.RolePermission.destroy({ where: { roleId: role.id, permissionId: req.params.permissionId } });
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Permission revoked');
}));
router.get('/:id/users', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const role = await Role_model_1.Role.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!role)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Role not found', 404);
    const userRoles = await UserRole_model_1.UserRole.findAll({
        where: { roleId: role.id },
        include: [{ model: User_model_1.User, attributes: ['id', 'uuid', 'firstName', 'lastName', 'email', 'avatar', 'status'] }],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, userRoles);
}));
exports.default = router;
//# sourceMappingURL=role.routes.js.map