"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const Broadcast_model_1 = require("../models/Broadcast.model");
const Staff_model_1 = require("../models/Staff.model");
const Notification_model_1 = require("../models/Notification.model");
const Role_model_1 = require("../models/Role.model");
const UserRole_model_1 = require("../models/UserRole.model");
const idOrUuid_1 = require("../utils/idOrUuid");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const PermissionCodes_1 = require("../config/PermissionCodes");
const router = (0, express_1.Router)();
function hasPermission(req, code) {
    const roles = (req.user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    if (roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin'))
        return true;
    const perms = new Set((req.user?.permissions || []).map((p) => String(p).toLowerCase()));
    return perms.has(code.toLowerCase());
}
async function getUserIdsForRoles(roleCodes) {
    const roles = await Role_model_1.Role.findAll({ where: { code: { [sequelize_1.Op.in]: roleCodes } }, attributes: ['id'] });
    const roleIds = roles.map((r) => r.id);
    if (!roleIds.length)
        return [];
    const userRoles = await UserRole_model_1.UserRole.findAll({ where: { roleId: { [sequelize_1.Op.in]: roleIds } }, attributes: ['userId'] });
    return [...new Set(userRoles.map((ur) => ur.userId))];
}
router.get('/', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BROADCAST_READ_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const broadcasts = await Broadcast_model_1.Broadcast.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
    ResponseFormatter_1.ResponseFormatter.success(res, broadcasts);
}));
router.post('/', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BROADCAST_CREATE_ALL, PermissionCodes_1.PermissionCode.BROADCAST_CREATE_OWN_DEPARTMENT), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const canCreateAll = hasPermission(req, PermissionCodes_1.PermissionCode.BROADCAST_CREATE_ALL);
    const user = req.user;
    let { title, message, audienceType = 'All', audienceValue } = req.body;
    if (!title || !message) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title and message are required', 400);
    }
    if (!canCreateAll) {
        if (!user?.departmentId) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'No department linked to this account', 400);
        }
        audienceType = 'Department';
        audienceValue = String(user.departmentId);
    }
    if (audienceType !== 'All' && !audienceValue) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'audienceValue is required for BusinessUnit/Department audiences', 400);
    }
    const broadcast = await Broadcast_model_1.Broadcast.create({
        title,
        message,
        audienceType,
        audienceValue,
        createdById: BigInt(user.id),
    });
    const where = {};
    if (audienceType === 'BusinessUnit')
        where.businessUnit = audienceValue;
    if (audienceType === 'Department')
        where.departmentId = BigInt(audienceValue);
    const recipients = await Staff_model_1.Staff.findAll({ where, attributes: ['userId'] });
    const recipientUserIds = new Set(recipients.map((s) => s.userId).filter(Boolean));
    if (!canCreateAll) {
        const ccUserIds = await getUserIdsForRoles(['hr', 'admin', 'superadmin']);
        ccUserIds.forEach((id) => recipientUserIds.add(id));
    }
    const recipientUserIdList = [...recipientUserIds];
    if (recipientUserIdList.length > 0) {
        await Notification_model_1.Notification.bulkCreate(recipientUserIdList.map((userId) => ({
            recipientUserId: userId,
            notificationType: 'Alert',
            title,
            message,
            relatedEntityType: 'Broadcast',
            relatedEntityId: broadcast.id,
            deliveryChannel: 'InApp',
            priority: 'Medium',
        })));
    }
    ResponseFormatter_1.ResponseFormatter.success(res, { ...broadcast.toJSON(), recipientCount: recipientUserIdList.length }, 'Broadcast sent', 201);
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BROADCAST_DELETE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const broadcast = await Broadcast_model_1.Broadcast.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!broadcast)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Broadcast not found');
    await broadcast.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Broadcast deleted');
}));
exports.default = router;
//# sourceMappingURL=broadcast.routes.js.map