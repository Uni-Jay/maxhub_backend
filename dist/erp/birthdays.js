"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBirthdays = runBirthdays;
exports.upcomingBirthdays = upcomingBirthdays;
exports.birthdaysRouter = birthdaysRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const outbound_1 = require("./outbound");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
function lagosToday() {
    const iso = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    const [y, m, d] = iso.split('-').map(Number);
    return { y, m, d, iso };
}
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
function dobMatch(col) {
    return `(EXTRACT(MONTH FROM (${col} AT TIME ZONE 'Africa/Lagos')) = :m AND EXTRACT(DAY FROM (${col} AT TIME ZONE 'Africa/Lagos')) = :d)
          OR (:feb28 AND EXTRACT(MONTH FROM (${col} AT TIME ZONE 'Africa/Lagos')) = 2 AND EXTRACT(DAY FROM (${col} AT TIME ZONE 'Africa/Lagos')) = 29)`;
}
const WISHES = [
    'May this new year bring you good health, joy and every success you are working for.',
    'Thank you for everything you bring to the team. Have a wonderful day!',
    'Wishing you a year full of growth, laughter and great achievements.',
];
async function alreadySent(key) {
    const row = await models_1.ErpModels.Setting.findByPk('birthdaysSent', { raw: true }).catch(() => null);
    return !!row?.value?.[key];
}
async function markSent(key, date) {
    const row = await models_1.ErpModels.Setting.findByPk('birthdaysSent', { raw: true }).catch(() => null);
    const value = Object.fromEntries(Object.entries((row?.value || {})).filter(([, v]) => String(v) >= date));
    value[key] = date;
    await models_1.ErpModels.Setting.upsert({ key: 'birthdaysSent', value });
}
async function postToGeneral(text) {
    const conv = (await q(`SELECT id FROM conversations WHERE "conversationCode" = 'CH-GENERAL' LIMIT 1`))[0];
    if (!conv)
        return;
    const sender = (await q(`SELECT ur."userId" AS id FROM user_roles ur JOIN roles r ON r.id = ur."roleId" WHERE r.code = 'superadmin' AND ur."deletedAt" IS NULL ORDER BY ur."userId" LIMIT 1`))[0]?.id || (await q(`SELECT MIN(id) AS id FROM users`))[0]?.id;
    if (!sender)
        return;
    const rows = await q(`INSERT INTO messages (uuid, "conversationId", "senderUserId", "messageText", "messageType", "isEdited", "isPinned", "starredByUserIds", "deletedForUserIds", "createdAt", "updatedAt")
     VALUES (:u, :c, :s, :t, 'Text', false, false, '[]', '[]', NOW(), NOW()) RETURNING id`, { u: (0, uuid_1.v4)(), c: conv.id, s: sender, t: text });
    await helpers_1.db.query(`UPDATE conversations SET "lastMessageAt" = NOW(), "updatedAt" = NOW() WHERE id = :c`, { replacements: { c: conv.id } }).catch(() => undefined);
    try {
        const io = global.__maxhubIO;
        if (io) {
            const u = (await q(`SELECT id, "firstName", "lastName", avatar FROM users WHERE id = :id`, { id: sender }))[0];
            const payload = { id: rows[0]?.id, conversationId: Number(conv.id), senderUserId: Number(sender), messageText: text, messageType: 'Text', createdAt: new Date().toISOString(), sender: u, reactions: {}, starredByUserIds: [], deletedForUserIds: [] };
            io.to(`conv:${conv.id}`).emit('chat:message', payload);
            const { notifyChatMessage } = require('./chatNotify');
            await notifyChatMessage(io, payload, Number(conv.id), Number(sender));
        }
    }
    catch { }
}
async function runBirthdays(force = false) {
    const t = lagosToday();
    const rep = { m: t.m, d: t.d, feb28: t.m === 2 && t.d === 28 && !isLeap(t.y) };
    const staff = await q(`SELECT s.id, s."userId", s."firstName", s."lastName", s.email, s.position, s."departmentId"
     FROM staff s WHERE s."deletedAt" IS NULL AND COALESCE(s.status::text, 'Active') = 'Active' AND s."dateOfBirth" IS NOT NULL AND (${dobMatch('s."dateOfBirth"')})`, rep);
    let sentStaff = 0;
    const names = [];
    for (const s of staff) {
        const key = `staff-${s.id}`;
        if (!force && (await alreadySent(key)))
            continue;
        names.push(`${s.firstName} ${s.lastName}`.trim());
        const brand = await (0, outbound_1.brandForDepartment)(s.departmentId ? Number(s.departmentId) : null);
        const wish = WISHES[(Number(s.id) + t.d) % WISHES.length];
        if (s.email) {
            await (0, outbound_1.sendBrandEmail)(brand, s.email, `Happy birthday, ${s.firstName}! 🎉`, (0, outbound_1.brandEmailHtml)(brand, `Happy birthday, ${(0, outbound_1.escapeHtml)(s.firstName)}! 🎂`, `
        <p>Everyone at ${(0, outbound_1.escapeHtml)(brand.displayName)} and across MaxHub — VisaMax, Kurios SAT, BeadMax and Maxfood Farm — wishes you a very happy birthday.</p>
        <p>${wish}</p><p>Enjoy your day!</p>`)).catch(() => undefined);
        }
        if (s.userId) {
            await (0, helpers_1.notifyUsers)(null, [Number(s.userId)], { title: `Happy birthday, ${s.firstName}! 🎂`, message: wish, type: 'System', priority: 'High', actionUrl: '/dashboard' });
        }
        await markSent(key, t.iso);
        sentStaff++;
    }
    if (names.length) {
        const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
        await postToGeneral(`🎂🎉 Happy birthday, ${list}! Wishing you a wonderful day and a great year ahead. Everyone, please join us in celebrating! 🎈`);
        const everyone = (await q(`SELECT DISTINCT "userId" FROM staff WHERE "deletedAt" IS NULL AND "userId" IS NOT NULL AND COALESCE(status::text,'Active') = 'Active'`)).map((r) => Number(r.userId));
        const celebrants = new Set(staff.map((s) => Number(s.userId)));
        await (0, helpers_1.notifyUsers)(null, everyone.filter((u) => !celebrants.has(u)), {
            title: `🎂 It's ${list}'s birthday today`, message: 'Send a birthday wish in the General channel.', type: 'System', actionUrl: '/messages',
        });
    }
    let sentClients = 0;
    const clients = await q(`SELECT c.id, c."fullName", c.email, c."departmentId" FROM clients c
     WHERE c."deletedAt" IS NULL AND COALESCE(c.status::text, 'Active') = 'Active' AND c.email IS NOT NULL AND c."dateOfBirth" IS NOT NULL
       AND (${dobMatch('c."dateOfBirth"::timestamp')})`, rep).catch(() => []);
    for (const c of clients) {
        const key = `client-${c.id}`;
        if (!force && (await alreadySent(key)))
            continue;
        const brand = await (0, outbound_1.brandForDepartment)(c.departmentId ? Number(c.departmentId) : null);
        await (0, outbound_1.sendBrandEmail)(brand, c.email, `Happy birthday from ${brand.displayName}! 🎉`, (0, outbound_1.brandEmailHtml)(brand, `Happy birthday, ${(0, outbound_1.escapeHtml)(String(c.fullName || '').split(' ')[0] || 'friend')}!`, `
      <p>Thank you for being part of the ${(0, outbound_1.escapeHtml)(brand.displayName)} family. We wish you a joyful birthday and a wonderful year ahead.</p>`)).catch(() => undefined);
        await markSent(key, t.iso);
        sentClients++;
    }
    if (sentStaff || sentClients)
        console.log(`🎂 [ERP] birthday wishes sent: ${sentStaff} staff, ${sentClients} client(s)`);
    return { staff: sentStaff, clients: sentClients };
}
async function upcomingBirthdays(days = 30) {
    const rows = await q(`SELECT s.id, s."firstName", s."lastName", s.position, s."departmentId", d.name AS department,
            (s."dateOfBirth" AT TIME ZONE 'Africa/Lagos')::date AS dob
     FROM staff s LEFT JOIN departments d ON d.id = s."departmentId"
     WHERE s."deletedAt" IS NULL AND COALESCE(s.status::text, 'Active') = 'Active' AND s."dateOfBirth" IS NOT NULL`);
    const t = lagosToday();
    const today = Date.UTC(t.y, t.m - 1, t.d);
    const out = [];
    for (const r of rows) {
        const dob = new Date(r.dob);
        let mm = dob.getUTCMonth();
        let dd = dob.getUTCDate();
        let next = Date.UTC(t.y, mm, dd);
        if (mm === 1 && dd === 29 && !isLeap(t.y)) {
            dd = 28;
            next = Date.UTC(t.y, 1, 28);
        }
        if (next < today) {
            const y = t.y + 1;
            next = Date.UTC(y, mm, mm === 1 && dob.getUTCDate() === 29 && !isLeap(y) ? 28 : dob.getUTCDate());
        }
        const daysAway = Math.round((next - today) / 86400000);
        if (daysAway <= days) {
            out.push({ staffId: Number(r.id), name: `${r.firstName} ${r.lastName}`, position: r.position, department: r.department, date: new Date(next).toISOString().slice(0, 10), daysAway });
        }
        void mm;
    }
    return out.sort((a, b) => a.daysAway - b.daysAway);
}
function birthdaysRouter() {
    const r = (0, express_1.Router)();
    r.get('/birthdays', (0, recordRouter_1.wrap)(async (req, res) => (0, recordRouter_1.ok)(res, await upcomingBirthdays(Math.min(366, Math.max(0, Number(req.query.days) || 30))))));
    r.post('/birthdays/run', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req) && (0, helpers_1.roleOf)(req) !== 'hr')
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can send birthday wishes now');
        return (0, recordRouter_1.ok)(res, await runBirthdays(false), 'Birthday wishes sent');
    }));
    return r;
}
//# sourceMappingURL=birthdays.js.map