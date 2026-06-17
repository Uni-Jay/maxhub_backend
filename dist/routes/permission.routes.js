"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Permission_model_1 = require("../models/Permission.model");
const RolePermission_model_1 = require("../models/RolePermission.model");
const Role_model_1 = require("../models/Role.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, module: mod, action, isActive, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (mod)
        where.module = mod;
    if (action)
        where.action = action;
    if (isActive !== undefined)
        where.isActive = isActive === 'true';
    if (search)
        where[sequelize_1.Op.or] = [
            { name: { [sequelize_1.Op.like]: `%${search}%` } },
            { code: { [sequelize_1.Op.like]: `%${search}%` } },
        ];
    const { count, rows } = await Permission_model_1.Permission.findAndCountAll({
        where, order: [['module', 'ASC'], ['resource', 'ASC'], ['action', 'ASC']],
        limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/modules', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await Permission_model_1.Permission.findAll({
        attributes: [[sequelize_1.Sequelize.fn('DISTINCT', sequelize_1.Sequelize.col('module')), 'module']],
        order: [['module', 'ASC']],
    });
    const modules = result.map((r) => r.module);
    ResponseFormatter_1.ResponseFormatter.success(res, modules);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const permission = await Permission_model_1.Permission.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!permission)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Permission not found', 404);
    const rolePerms = await RolePermission_model_1.RolePermission.findAll({ where: { permissionId: permission.id } });
    const roleIds = rolePerms.map((rp) => rp.roleId);
    const roles = roleIds.length > 0 ? await Role_model_1.Role.findAll({ where: { id: { [sequelize_1.Op.in]: roleIds } }, attributes: ['id', 'uuid', 'code', 'name'] }) : [];
    ResponseFormatter_1.ResponseFormatter.success(res, { ...permission.toJSON(), roles });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('RBAC.PERMISSION.CREATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { code, name, description, module: mod, resource, action, scope } = req.body;
    if (!code || !name || !mod || !resource || !action || !scope) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'code, name, module, resource, action, scope are required', 400);
    }
    const existing = await Permission_model_1.Permission.findOne({ where: { code } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Permission code already exists', 409);
    const permission = await Permission_model_1.Permission.create({
        uuid: (0, uuid_1.v4)(), code, name, description,
        module: mod, resource, action, scope, isActive: true,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, permission, 'Permission created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('RBAC.PERMISSION.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const permission = await Permission_model_1.Permission.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!permission)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Permission not found', 404);
    const { name, description, isActive } = req.body;
    await permission.update({ name, description, isActive });
    ResponseFormatter_1.ResponseFormatter.success(res, permission, 'Permission updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('RBAC.PERMISSION.DELETE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const permission = await Permission_model_1.Permission.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!permission)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Permission not found', 404);
    const assignedCount = await RolePermission_model_1.RolePermission.count({ where: { permissionId: permission.id } });
    if (assignedCount > 0)
        return ResponseFormatter_1.ResponseFormatter.error(res, `Permission assigned to ${assignedCount} role(s), revoke first`, 400);
    await permission.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Permission deleted');
}));
exports.default = router;
//# sourceMappingURL=permission.routes.js.map