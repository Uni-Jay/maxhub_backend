"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAllChannels = syncAllChannels;
exports.syncUserChannels = syncUserChannels;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Database_1 = __importDefault(require("../config/Database"));
const q = (sql, replacements = {}) => Database_1.default.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
async function ownerId() {
    const r = await q(`SELECT MIN(id) AS id FROM users`);
    return Number(r[0]?.id || 1);
}
async function ensureChannel(code, title) {
    const ex = await q(`SELECT id, title FROM conversations WHERE "conversationCode" = :code LIMIT 1`, { code });
    if (ex[0]) {
        if (ex[0].title !== title)
            await Database_1.default.query(`UPDATE conversations SET title = :title WHERE id = :id`, { replacements: { title, id: ex[0].id } });
        return Number(ex[0].id);
    }
    const ins = await q(`INSERT INTO conversations (uuid, "conversationCode", title, "conversationType", "createdById", "isArchived", "createdAt", "updatedAt")
     VALUES (:uuid, :code, :title, 'Channel', :owner, false, NOW(), NOW()) RETURNING id`, { uuid: (0, uuid_1.v4)(), code, title, owner: await ownerId() });
    return Number(ins[0].id);
}
async function addMembers(conversationId, userIds) {
    if (!userIds.length)
        return;
    await Database_1.default.query(`UPDATE conversation_participants SET "deletedAt" = NULL WHERE "conversationId" = :c AND "userId" IN (:u) AND "deletedAt" IS NOT NULL`, { replacements: { c: conversationId, u: userIds } });
    for (const u of userIds) {
        await Database_1.default.query(`INSERT INTO conversation_participants (uuid, "conversationId", "userId", role, "joinedAt", "isMuted", "createdAt", "updatedAt")
       SELECT :uuid, :c, :u, 'Member', NOW(), false, NOW(), NOW()
       WHERE NOT EXISTS (SELECT 1 FROM conversation_participants WHERE "conversationId" = :c AND "userId" = :u)`, { replacements: { uuid: (0, uuid_1.v4)(), c: conversationId, u } });
    }
}
async function headOfficeBranchId() {
    const r = await q(`SELECT value FROM erp_settings WHERE key = 'headOfficeBranchId'`);
    return r[0]?.value ? Number(r[0].value) : null;
}
async function staffUsers() {
    const rows = await q(`SELECT u.id AS "userId", s."branchId", s."departmentId",
            COALESCE((SELECT json_agg(sd."departmentId") FROM staff_departments sd WHERE sd."staffId" = s.id), '[]') AS extra
     FROM users u
     LEFT JOIN staff s ON s."userId" = u.id AND s."deletedAt" IS NULL
     WHERE u."deletedAt" IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur."roleId"
         WHERE ur."userId" = u.id AND ur."deletedAt" IS NULL AND LOWER(r.code) = 'student'
       )`);
    return rows.map((r) => ({
        userId: Number(r.userId),
        branchId: r.branchId ? Number(r.branchId) : null,
        deptIds: [r.departmentId, ...(Array.isArray(r.extra) ? r.extra : [])].filter(Boolean).map(Number),
    }));
}
async function managementUserIds() {
    const rows = await q(`SELECT DISTINCT ur."userId" FROM user_roles ur JOIN roles r ON r.id = ur."roleId"
     WHERE ur."deletedAt" IS NULL AND LOWER(REGEXP_REPLACE(r.code, '[^a-zA-Z]', '', 'g')) IN ('superadmin', 'admin', 'headofadmin')`);
    return rows.map((r) => Number(r.userId));
}
async function syncAllChannels() {
    const users = await staffUsers();
    const mgmt = new Set(await managementUserIds());
    const general = await ensureChannel('CH-GENERAL', '📢 MaxHub General');
    await addMembers(general, users.map((u) => u.userId));
    const depts = await q(`SELECT id, name, "parentDepartmentId", "headUserId" FROM departments WHERE "deletedAt" IS NULL AND status = 'Active'`);
    const parentOf = new Map(depts.map((d) => [Number(d.id), d.parentDepartmentId ? Number(d.parentDepartmentId) : null]));
    for (const d of depts) {
        const id = Number(d.id);
        const chan = await ensureChannel(`CH-DEPT-${id}`, `🏢 ${d.name}`);
        const members = users
            .filter((u) => mgmt.has(u.userId) || u.deptIds.some((x) => x === id || parentOf.get(x) === id || parentOf.get(id) === x))
            .map((u) => u.userId);
        if (d.headUserId)
            members.push(Number(d.headUserId));
        await addMembers(chan, [...new Set(members)]);
    }
    const hq = await headOfficeBranchId();
    const branches = await q(`SELECT id, "branchName" FROM branches WHERE "deletedAt" IS NULL AND status = 'Active'`);
    for (const b of branches) {
        const id = Number(b.id);
        const chan = await ensureChannel(`CH-BRANCH-${id}`, `📍 ${b.branchName}`);
        const members = users.filter((u) => mgmt.has(u.userId) || u.branchId === id || (!u.branchId && id === hq)).map((u) => u.userId);
        await addMembers(chan, members);
    }
}
let lastFullSync = 0;
async function syncUserChannels(_userId) {
    if (Date.now() - lastFullSync < 60000)
        return;
    lastFullSync = Date.now();
    await syncAllChannels();
}
//# sourceMappingURL=channels.js.map