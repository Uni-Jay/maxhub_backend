"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.roleOf = roleOf;
exports.isSuper = isSuper;
exports.isManagement = isManagement;
exports.userId = userId;
exports.userName = userName;
exports.headedDepartmentIds = headedDepartmentIds;
exports.memberDepartmentIds = memberDepartmentIds;
exports.resolveDepartmentId = resolveDepartmentId;
exports.departmentFamily = departmentFamily;
exports.staffUserId = staffUserId;
exports.nextCode = nextCode;
exports.randomToken = randomToken;
exports.sha256 = sha256;
exports.emitChange = emitChange;
exports.audit = audit;
exports.userIdsWithRoles = userIdsWithRoles;
exports.departmentHeadUserIds = departmentHeadUserIds;
exports.notifyUsers = notifyUsers;
exports.toNum = toNum;
exports.publicAppUrl = publicAppUrl;
const crypto_1 = __importDefault(require("crypto"));
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
const RoleBucket_1 = require("../utils/RoleBucket");
exports.db = Database_1.default;
function roleOf(req) {
    return (0, RoleBucket_1.getRoleBucket)(req);
}
function isSuper(req) {
    return roleOf(req) === 'superadmin';
}
function isManagement(req) {
    const r = roleOf(req);
    return r === 'superadmin' || r === 'admin';
}
function userId(req) {
    return Number(req.user?.id);
}
function userName(req) {
    const u = req.user || {};
    return u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Staff';
}
async function headedDepartmentIds(uid) {
    const rows = await exports.db.query(`SELECT id, "parentDepartmentId" FROM departments WHERE "deletedAt" IS NULL AND "headUserId" = :uid`, { replacements: { uid }, type: sequelize_1.QueryTypes.SELECT });
    const ids = new Set(rows.map((r) => Number(r.id)));
    if (ids.size) {
        const kids = await exports.db.query(`SELECT id FROM departments WHERE "deletedAt" IS NULL AND "parentDepartmentId" IN (:ids)`, { replacements: { ids: [...ids] }, type: sequelize_1.QueryTypes.SELECT });
        kids.forEach((k) => ids.add(Number(k.id)));
    }
    return [...ids];
}
async function memberDepartmentIds(uid) {
    const rows = await exports.db.query(`SELECT s."departmentId" AS id FROM staff s WHERE s."userId" = :uid AND s."deletedAt" IS NULL AND s."departmentId" IS NOT NULL
     UNION SELECT sd."departmentId" FROM staff_departments sd JOIN staff s ON s.id = sd."staffId" WHERE s."userId" = :uid`, { replacements: { uid }, type: sequelize_1.QueryTypes.SELECT });
    const ids = new Set(rows.map((r) => Number(r.id)).filter(Boolean));
    if (ids.size) {
        const kids = await exports.db.query(`SELECT id FROM departments WHERE "deletedAt" IS NULL AND "parentDepartmentId" IN (:ids)`, { replacements: { ids: [...ids] }, type: sequelize_1.QueryTypes.SELECT });
        kids.forEach((k) => ids.add(Number(k.id)));
    }
    return [...ids];
}
async function resolveDepartmentId(v) {
    if (v === undefined || v === null || v === '')
        return null;
    if (/^\d+$/.test(String(v)))
        return Number(v);
    const rows = await exports.db.query(`SELECT id FROM departments WHERE UPPER(code) = UPPER(:c) AND "deletedAt" IS NULL LIMIT 1`, { replacements: { c: String(v) }, type: sequelize_1.QueryTypes.SELECT });
    return rows[0] ? Number(rows[0].id) : null;
}
async function departmentFamily(id) {
    const rows = await exports.db.query(`SELECT id FROM departments WHERE "deletedAt" IS NULL AND (id = :id OR "parentDepartmentId" = :id)`, { replacements: { id }, type: sequelize_1.QueryTypes.SELECT });
    return rows.map((r) => Number(r.id));
}
async function staffUserId(staffId) {
    if (!staffId)
        return null;
    const rows = await exports.db.query(`SELECT "userId" FROM staff WHERE id = :id`, {
        replacements: { id: staffId }, type: sequelize_1.QueryTypes.SELECT,
    });
    return rows[0]?.userId ? Number(rows[0].userId) : null;
}
async function nextCode(prefix) {
    const year = new Date().getFullYear();
    const key = `counter:${prefix}:${year}`;
    return exports.db.transaction(async (t) => {
        await exports.db.query(`INSERT INTO erp_settings (key, value, "createdAt", "updatedAt") VALUES (:k, '0'::jsonb, NOW(), NOW())
       ON CONFLICT (key) DO NOTHING`, { replacements: { k: key }, transaction: t });
        const rows = await exports.db.query(`UPDATE erp_settings SET value = to_jsonb((value::text)::int + 1), "updatedAt" = NOW()
       WHERE key = :k RETURNING value`, { replacements: { k: key }, type: sequelize_1.QueryTypes.SELECT, transaction: t });
        const n = Number(rows[0]?.value ?? 1);
        return `${prefix}-${year}-${String(n).padStart(4, '0')}`;
    });
}
function randomToken(bytes = 24) {
    return crypto_1.default.randomBytes(bytes).toString('base64url');
}
function sha256(s) {
    return crypto_1.default.createHash('sha256').update(s || '').digest('hex');
}
function emitChange(req, entity, action, data) {
    try {
        const io = req?.app?.get?.('io') || global.__maxhubIO;
        if (io)
            io.emit('erp:changed', { entity, action, id: data?.id ?? null, at: new Date().toISOString() });
    }
    catch { }
}
async function audit(req, module, action, entity, entityId, description, changes) {
    if (req)
        req.__audited = true;
    try {
        await exports.db.query(`INSERT INTO audit_logs (uuid, module, action, entity, "entityId", description, changes, "userId", "ipAddress", "userAgent", status, "createdAt")
       VALUES (gen_random_uuid(), :module, :action, :entity, :entityId, :description, :changes, :userId, :ip, :ua, 'Success', NOW())`, {
            replacements: {
                module, action, entity, entityId: Number(entityId) || 0, description,
                changes: changes ? JSON.stringify(changes).slice(0, 20000) : null,
                userId: userId(req) || 0, ip: require('./auditTrail').clientIp(req), ua: req.get('user-agent') || null,
            },
        });
    }
    catch { }
}
async function userIdsWithRoles(roles) {
    const rows = await exports.db.query(`SELECT DISTINCT ur."userId" FROM user_roles ur JOIN roles r ON r.id = ur."roleId"
     JOIN users u ON u.id = ur."userId"
     WHERE ur."deletedAt" IS NULL AND u."deletedAt" IS NULL AND LOWER(REGEXP_REPLACE(r.code, '[^a-zA-Z]', '', 'g')) IN (:roles)`, { replacements: { roles: roles.map((r) => r.toLowerCase()) }, type: sequelize_1.QueryTypes.SELECT });
    return rows.map((r) => Number(r.userId));
}
async function departmentHeadUserIds(departmentId) {
    if (!departmentId)
        return [];
    const rows = await exports.db.query(`SELECT "headUserId" FROM departments WHERE "headUserId" IS NOT NULL AND (id = :id OR id = (SELECT "parentDepartmentId" FROM departments WHERE id = :id))`, { replacements: { id: departmentId }, type: sequelize_1.QueryTypes.SELECT });
    return rows.map((r) => Number(r.headUserId));
}
async function notifyUsers(req, userIds, n, opts = {}) {
    const { notifyUser } = require('../utils/notify');
    const io = req?.app?.get?.('io') || global.__maxhubIO;
    const unique = [...new Set(userIds.filter((u) => u && u !== opts.excludeSelf))];
    for (const uid of unique) {
        try {
            await notifyUser(uid, {
                type: n.type || 'System', title: n.title, message: n.message, actionUrl: n.actionUrl,
                priority: n.priority || 'Medium', relatedEntityType: n.entityType, relatedEntityId: n.entityId,
            }, io);
        }
        catch { }
    }
}
function toNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
}
function publicAppUrl() {
    return (process.env.FRONTEND_URL || process.env.APP_URL || 'https://www.maxhubng.company').replace(/\/$/, '');
}
//# sourceMappingURL=helpers.js.map