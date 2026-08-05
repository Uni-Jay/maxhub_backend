"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const User_model_1 = require("@models/User.model");
const Role_model_1 = require("@models/Role.model");
const UserRole_model_1 = require("@models/UserRole.model");
const RolePermission_model_1 = require("@models/RolePermission.model");
const Permission_model_1 = require("@models/Permission.model");
const UserPermission_model_1 = require("@models/UserPermission.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/:userId/permissions', AuthMiddleware_1.default.requireRole('superadmin'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = BigInt(req.params.userId);
    const user = await User_model_1.User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName', 'email'] });
    if (!user)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'User not found');
    const userRoles = await UserRole_model_1.UserRole.findAll({ where: { userId } });
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = roleIds.length ? await Role_model_1.Role.findAll({ where: { id: { [sequelize_1.Op.in]: roleIds } }, attributes: ['id', 'code', 'name'] }) : [];
    const rolePermissionRows = roleIds.length
        ? await RolePermission_model_1.RolePermission.findAll({ where: { roleId: { [sequelize_1.Op.in]: roleIds } }, attributes: ['permissionId'] })
        : [];
    const rolePermissionIds = [...new Set(rolePermissionRows.map((rp) => rp.permissionId))];
    const roleDerivedPermissions = rolePermissionIds.length
        ? await Permission_model_1.Permission.findAll({ where: { id: { [sequelize_1.Op.in]: rolePermissionIds } }, attributes: ['code', 'name', 'module'] })
        : [];
    const directRows = await UserPermission_model_1.UserPermission.findAll({ where: { userId } });
    const directPermissionIds = directRows.map((up) => up.permissionId);
    const directPermissions = directPermissionIds.length
        ? await Permission_model_1.Permission.findAll({ where: { id: { [sequelize_1.Op.in]: directPermissionIds } }, attributes: ['code', 'name', 'module'] })
        : [];
    ResponseFormatter_1.ResponseFormatter.success(res, {
        user: { id: Number(user.id), firstName: user.firstName, lastName: user.lastName, email: user.email },
        roles: roles.map((r) => ({ code: r.code, name: r.name })),
        roleDerivedPermissions: roleDerivedPermissions.map((p) => ({ code: p.code, name: p.name, module: p.module })),
        directPermissions: directPermissions.map((p) => ({ code: p.code, name: p.name, module: p.module })),
    });
}));
router.post('/:userId/permissions', AuthMiddleware_1.default.requireRole('superadmin'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = BigInt(req.params.userId);
    const { code, reason } = req.body;
    if (!code)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'code is required', 400);
    const [user, permission] = await Promise.all([
        User_model_1.User.findByPk(userId),
        Permission_model_1.Permission.findOne({ where: { code } }),
    ]);
    if (!user)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'User not found');
    if (!permission)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, `Permission code not found: ${code}`);
    await UserPermission_model_1.UserPermission.findOrCreate({
        where: { userId, permissionId: permission.id },
        defaults: { userId, permissionId: permission.id, reason },
    });
    ResponseFormatter_1.ResponseFormatter.success(res, null, `Granted ${code} to this user`, 201);
}));
router.delete('/:userId/permissions/:code', AuthMiddleware_1.default.requireRole('superadmin'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = BigInt(req.params.userId);
    const permission = await Permission_model_1.Permission.findOne({ where: { code: req.params.code } });
    if (!permission)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, `Permission code not found: ${req.params.code}`);
    const grant = await UserPermission_model_1.UserPermission.findOne({ where: { userId, permissionId: permission.id } });
    if (!grant)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'This user does not have a direct grant for that permission');
    await grant.destroy({ force: true });
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Permission revoked');
}));
exports.default = router;
//# sourceMappingURL=user-permission.routes.js.map