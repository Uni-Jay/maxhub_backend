"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const Module_model_1 = require("../models/Module.model");
const UserModulePermission_model_1 = require("../models/UserModulePermission.model");
const User_model_1 = require("../models/User.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.use(AuthMiddleware_1.default.requireRole('superadmin'));
const DEFAULT_MODULES = [
    { name: 'Dashboard', code: 'dashboard', icon: 'LayoutDashboard', isDefault: true, displayOrder: 1 },
    { name: 'Staff Management', code: 'staff', icon: 'Users', isDefault: true, displayOrder: 2 },
    { name: 'Attendance', code: 'attendance', icon: 'Clock', isDefault: true, displayOrder: 3 },
    { name: 'Leave Management', code: 'leave', icon: 'Calendar', isDefault: true, displayOrder: 4 },
    { name: 'Projects', code: 'projects', icon: 'FolderKanban', isDefault: true, displayOrder: 5 },
    { name: 'Tasks', code: 'tasks', icon: 'CheckSquare', isDefault: true, displayOrder: 6 },
    { name: 'CRM', code: 'crm', icon: 'UserCheck', isDefault: false, displayOrder: 7 },
    { name: 'Clients', code: 'clients', icon: 'Building', isDefault: true, displayOrder: 8 },
    { name: 'Payroll', code: 'payroll', icon: 'DollarSign', isDefault: false, displayOrder: 9 },
    { name: 'Inventory', code: 'inventory', icon: 'Package', isDefault: false, displayOrder: 10 },
    { name: 'Learning (LMS)', code: 'lms', icon: 'BookOpen', isDefault: true, displayOrder: 11 },
    { name: 'Recruitment (HR)', code: 'recruitment', icon: 'UserPlus', isDefault: false, displayOrder: 12 },
    { name: 'Messaging', code: 'messaging', icon: 'MessageSquare', isDefault: true, displayOrder: 13 },
    { name: 'Video Calls', code: 'videocall', icon: 'Video', isDefault: true, displayOrder: 14 },
    { name: 'Calendar', code: 'calendar', icon: 'CalendarDays', isDefault: true, displayOrder: 15 },
    { name: 'File Manager', code: 'files', icon: 'FolderOpen', isDefault: true, displayOrder: 16 },
    { name: 'Analytics', code: 'analytics', icon: 'BarChart', isDefault: false, displayOrder: 17 },
    { name: 'Invoices / Sales', code: 'invoices', icon: 'Receipt', isDefault: false, displayOrder: 18 },
    { name: 'Communication', code: 'communication', icon: 'Mail', isDefault: true, displayOrder: 19 },
    { name: 'Audit Logs', code: 'audit', icon: 'Shield', isDefault: false, displayOrder: 20 },
    { name: 'AI Assistant', code: 'ai', icon: 'Bot', isDefault: false, displayOrder: 21 },
    { name: 'Reports', code: 'reports', icon: 'FileText', isDefault: false, displayOrder: 22 },
    { name: 'Roles & Permissions', code: 'roles', icon: 'Key', isDefault: false, displayOrder: 23 },
    { name: 'System Settings', code: 'settings', icon: 'Settings', isDefault: false, displayOrder: 24 },
];
router.post('/seed', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    let created = 0;
    for (const mod of DEFAULT_MODULES) {
        const [, wasCreated] = await Module_model_1.AppModule.findOrCreate({
            where: { code: mod.code },
            defaults: { ...mod, uuid: (0, uuid_1.v4)() },
        });
        if (wasCreated)
            created++;
    }
    ResponseFormatter_1.ResponseFormatter.success(res, { seeded: created, total: DEFAULT_MODULES.length }, `Seeded ${created} new modules`);
}));
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const modules = await Module_model_1.AppModule.findAll({ order: [['displayOrder', 'ASC'], ['name', 'ASC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, modules);
}));
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name, code, description, icon, isDefault, displayOrder } = req.body;
    if (!name || !code)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'name and code are required', 400);
    const existing = await Module_model_1.AppModule.findOne({ where: { code } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Module code already exists', 409);
    const mod = await Module_model_1.AppModule.create({ uuid: (0, uuid_1.v4)(), name, code, description, icon, isDefault: isDefault ?? false, displayOrder: displayOrder ?? 0 });
    ResponseFormatter_1.ResponseFormatter.success(res, mod, 'Module created', 201);
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const mod = await Module_model_1.AppModule.findOne({ where: { [sequelize_1.Op.or]: [(0, idOrUuid_1.idOrUuidWhere)(req.params.id), { code: req.params.id }] } });
    if (!mod)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Module not found', 404);
    const { name, description, icon, isActive, isDefault, displayOrder } = req.body;
    await mod.update({ name, description, icon, isActive, isDefault, displayOrder });
    ResponseFormatter_1.ResponseFormatter.success(res, mod, 'Module updated');
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const mod = await Module_model_1.AppModule.findOne({ where: { [sequelize_1.Op.or]: [(0, idOrUuid_1.idOrUuidWhere)(req.params.id), { code: req.params.id }] } });
    if (!mod)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Module not found', 404);
    if (mod.isDefault)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Cannot delete a default module', 400);
    await mod.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Module deleted');
}));
router.get('/user-permissions/:userId', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const perms = await UserModulePermission_model_1.UserModulePermission.findAll({ where: { userId: req.params.userId } });
    ResponseFormatter_1.ResponseFormatter.success(res, perms);
}));
router.put('/user-permissions/:userId', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { permissions } = req.body;
    if (!Array.isArray(permissions))
        return ResponseFormatter_1.ResponseFormatter.error(res, 'permissions array required', 400);
    const user = await User_model_1.User.findByPk(userId);
    if (!user)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'User not found', 404);
    await Promise.all(permissions.map(async (p) => {
        await UserModulePermission_model_1.UserModulePermission.upsert({
            userId: BigInt(userId),
            moduleCode: p.moduleCode,
            canView: p.canView ?? false,
            canCreate: p.canCreate ?? false,
            canEdit: p.canEdit ?? false,
            canDelete: p.canDelete ?? false,
        });
    }));
    const updated = await UserModulePermission_model_1.UserModulePermission.findAll({ where: { userId } });
    ResponseFormatter_1.ResponseFormatter.success(res, updated, 'Module permissions updated');
}));
router.delete('/user-permissions/:userId/:moduleCode', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId, moduleCode } = req.params;
    await UserModulePermission_model_1.UserModulePermission.destroy({ where: { userId, moduleCode } });
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Permission override removed');
}));
exports.default = router;
//# sourceMappingURL=module.routes.js.map