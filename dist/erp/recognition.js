"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUGGESTION_CATEGORIES = void 0;
exports.nominationReminder = nominationReminder;
exports.recognitionRouter = recognitionRouter;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const thisMonth = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }).slice(0, 7);
const monthLabel = (m) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const isHR = (req) => (0, helpers_1.isManagement)(req) || (0, helpers_1.roleOf)(req) === 'hr';
async function allStaffUserIds() {
    return (await q(`SELECT DISTINCT s."userId" FROM staff s JOIN users u ON u.id = s."userId" AND u."deletedAt" IS NULL WHERE s."deletedAt" IS NULL AND s.status = 'Active' AND s."userId" IS NOT NULL`)).map((r) => Number(r.userId));
}
async function nominationReminder() {
    const m = thisMonth();
    if (await models_1.ErpModels.Award.findOne({ where: { month: m } }))
        return;
    await (0, helpers_1.notifyUsers)(null, await allStaffUserIds(), {
        title: `Who should be staff of the month for ${monthLabel(m)}?`, type: 'Other',
        message: 'Nominate a colleague who went the extra mile this month. It takes a minute.', actionUrl: '/staff-of-the-month',
    });
}
const voterHash = (uid, suggestionId) => crypto_1.default.createHash('sha256').update(`${process.env.JWT_SECRET || 'maxhub'}:vote:${suggestionId}:${uid}`).digest('hex').slice(0, 32);
exports.SUGGESTION_CATEGORIES = ['Workplace & welfare', 'Customers & service', 'Processes & tools', 'Money & costs', 'Training & growth', 'Concern or complaint', 'General'];
function recognitionRouter() {
    const r = (0, express_1.Router)();
    r.get('/recognition', (0, recordRouter_1.wrap)(async (req, res) => {
        const month = /^\d{4}-\d{2}$/.test(String(req.query.month || '')) ? String(req.query.month) : thisMonth();
        const me = (0, helpers_1.userId)(req);
        const myStaff = (await q(`SELECT id FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: me }))[0];
        const winners = await q(`SELECT a.*, s."firstName", s."lastName", s.position, u.avatar, d.name AS "departmentName"
       FROM erp_awards a JOIN staff s ON s.id = a."staffId" LEFT JOIN users u ON u.id = s."userId" LEFT JOIN departments d ON d.id = s."departmentId"
       ORDER BY a.month DESC LIMIT 24`);
        const mine = (await q(`SELECT n.*, s."firstName" || ' ' || s."lastName" AS "nomineeName" FROM erp_nominations n JOIN staff s ON s.id = n."nomineeStaffId" WHERE n.month = :m AND n."nominatorUserId" = :u`, { m: month, u: me }))[0] || null;
        const total = Number((await q(`SELECT COUNT(*)::int n FROM erp_nominations WHERE month = :m`, { m: month }))[0]?.n || 0);
        let nominees = [];
        if (isHR(req)) {
            const rows = await q(`SELECT n."nomineeStaffId", s."firstName" || ' ' || s."lastName" AS name, s.position, d.name AS "departmentName", u.avatar,
                json_agg(json_build_object('reason', n.reason, 'by', COALESCE(NULLIF(TRIM(nu."firstName" || ' ' || nu."lastName"), ''), nu.email), 'at', n."createdAt") ORDER BY n."createdAt") AS reasons
         FROM erp_nominations n JOIN staff s ON s.id = n."nomineeStaffId" LEFT JOIN users u ON u.id = s."userId" LEFT JOIN departments d ON d.id = s."departmentId"
         LEFT JOIN users nu ON nu.id = n."nominatorUserId"
         WHERE n.month = :m GROUP BY n."nomineeStaffId", s."firstName", s."lastName", s.position, d.name, u.avatar ORDER BY COUNT(*) DESC, name`, { m: month });
            nominees = rows.map((x) => ({ staffId: Number(x.nomineeStaffId), name: x.name, position: x.position, departmentName: x.departmentName, avatar: x.avatar, votes: (x.reasons || []).length, reasons: x.reasons || [] }));
        }
        const people = await q(`SELECT s.id, s."firstName" || ' ' || s."lastName" AS name, s.position, d.name AS "departmentName" FROM staff s LEFT JOIN departments d ON d.id = s."departmentId"
       WHERE s."deletedAt" IS NULL AND s.status = 'Active' ${myStaff ? 'AND s.id <> :me' : ''} ORDER BY name`, { me: myStaff?.id || 0 });
        const myWins = myStaff ? winners.filter((w) => Number(w.staffId) === Number(myStaff.id)).length : 0;
        const list = winners.map((w) => ({ ...w, id: Number(w.id), staffId: Number(w.staffId), name: `${w.firstName} ${w.lastName}`, monthLabel: monthLabel(w.month) }));
        return (0, recordRouter_1.ok)(res, {
            month, monthLabel: monthLabel(month), current: list.find((w) => w.month === month) || null, latest: list[0] || null,
            winners: list,
            myNomination: mine, totalNominations: total, nominees, people: people.map((p) => ({ ...p, id: Number(p.id) })), canAward: (0, helpers_1.isManagement)(req), canSeeNominations: isHR(req), myWins,
        });
    }));
    r.post('/recognition/nominate', (0, recordRouter_1.wrap)(async (req, res) => {
        const month = thisMonth();
        const me = (0, helpers_1.userId)(req);
        const staffId = Number(req.body?.staffId);
        const reason = String(req.body?.reason || '').trim().slice(0, 2000);
        if (!staffId)
            return (0, recordRouter_1.fail)(res, 400, 'Choose a colleague');
        if (reason.length < 10)
            return (0, recordRouter_1.fail)(res, 400, 'Say what they did — a sentence or two');
        const nominee = (await q(`SELECT id, "userId", "firstName" FROM staff WHERE id = :s AND "deletedAt" IS NULL AND status = 'Active'`, { s: staffId }))[0];
        if (!nominee)
            return (0, recordRouter_1.fail)(res, 404, 'Colleague not found');
        if (Number(nominee.userId) === me)
            return (0, recordRouter_1.fail)(res, 400, 'You cannot nominate yourself');
        if (await models_1.ErpModels.Award.findOne({ where: { month } }))
            return (0, recordRouter_1.fail)(res, 400, 'This month’s staff of the month has already been chosen');
        const existing = await models_1.ErpModels.Nomination.findOne({ where: { month, nominatorUserId: me } });
        if (existing)
            await existing.update({ nomineeStaffId: staffId, reason });
        else
            await models_1.ErpModels.Nomination.create({ month, nomineeStaffId: staffId, nominatorUserId: me, reason });
        (0, helpers_1.emitChange)(req, 'nomination', 'updated', { id: staffId });
        return (0, recordRouter_1.ok)(res, { month }, existing ? 'Nomination changed' : `Thank you — ${nominee.firstName} has been nominated`);
    }));
    r.post('/recognition/award', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only management can choose staff of the month');
        const month = /^\d{4}-\d{2}$/.test(String(req.body?.month || '')) ? String(req.body.month) : thisMonth();
        const staffId = Number(req.body?.staffId);
        const s = (await q(`SELECT s.id, s."userId", s."firstName", s."lastName", s.position, s.email, s."departmentId" FROM staff s WHERE s.id = :s AND s."deletedAt" IS NULL`, { s: staffId }))[0];
        if (!s)
            return (0, recordRouter_1.fail)(res, 404, 'Staff member not found');
        const citation = String(req.body?.citation || '').trim().slice(0, 3000);
        if (citation.length < 10)
            return (0, recordRouter_1.fail)(res, 400, 'Write a short citation — why they won');
        const prize = req.body?.prize ? String(req.body.prize).slice(0, 200) : null;
        const existing = await models_1.ErpModels.Award.findOne({ where: { month } });
        if (existing)
            await existing.update({ staffId, citation, prize, announcedById: (0, helpers_1.userId)(req), announcedByName: (0, helpers_1.userName)(req) });
        else
            await models_1.ErpModels.Award.create({ month, staffId, citation, prize, announcedById: (0, helpers_1.userId)(req), announcedByName: (0, helpers_1.userName)(req) });
        const name = `${s.firstName} ${s.lastName}`;
        await (0, helpers_1.notifyUsers)(req, await allStaffUserIds(), { title: `🏆 Staff of the month: ${name}`, type: 'Other', priority: 'High', message: `${monthLabel(month)} — ${citation.slice(0, 200)}`, actionUrl: '/staff-of-the-month' }, { excludeSelf: Number(s.userId) });
        if (s.userId)
            await (0, helpers_1.notifyUsers)(req, [Number(s.userId)], { title: '🏆 You are staff of the month!', type: 'Other', priority: 'High', message: `Congratulations! ${citation.slice(0, 220)}`, actionUrl: '/staff-of-the-month' });
        try {
            const { postToGeneral } = require('./birthdays');
            await postToGeneral(`🏆 Staff of the month — ${monthLabel(month)}\n\nCongratulations to ${name}${s.position ? ` (${s.position})` : ''}!\n\n${citation}${prize ? `\n\nPrize: ${prize}` : ''}`);
        }
        catch (e) {
            console.error('[recognition] general post failed:', e.message);
        }
        try {
            const { brandEmailHtml, brandForDepartment, escapeHtml, sendBrandEmail } = require('./outbound');
            if (s.email) {
                const brand = await brandForDepartment(s.departmentId ? Number(s.departmentId) : null);
                await sendBrandEmail(brand, s.email, `You are staff of the month, ${s.firstName}! 🏆`, brandEmailHtml(brand, `Congratulations, ${escapeHtml(s.firstName)}!`, `<p>You have been named <b>staff of the month for ${monthLabel(month)}</b>.</p><p>${escapeHtml(citation)}</p>${prize ? `<p><b>Prize:</b> ${escapeHtml(prize)}</p>` : ''}<p>Thank you for everything you do.</p>`));
            }
        }
        catch (e) {
            console.error('[recognition] email failed:', e.message);
        }
        await (0, helpers_1.audit)(req, 'Recognition', 'Award', 'Staff', staffId, `${(0, helpers_1.userName)(req)} named ${name} staff of the month for ${monthLabel(month)}`);
        (0, helpers_1.emitChange)(req, 'award', 'created', { id: staffId });
        return (0, recordRouter_1.ok)(res, { month, staffId }, `${s.firstName} is staff of the month — everyone has been told`);
    }));
    r.delete('/recognition/award/:month', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only management can undo an award');
        const row = await models_1.ErpModels.Award.findOne({ where: { month: req.params.month } });
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'No award for that month');
        await row.destroy();
        await (0, helpers_1.audit)(req, 'Recognition', 'Delete', 'Award', row.staffId, `${(0, helpers_1.userName)(req)} removed the staff of the month award for ${monthLabel(row.month)}`);
        return (0, recordRouter_1.ok)(res, null, 'Award removed');
    }));
    r.get('/suggestions', (0, recordRouter_1.wrap)(async (req, res) => {
        const mgmt = isHR(req);
        const rows = await models_1.ErpModels.Suggestion.findAll({ where: mgmt ? {} : { isPublic: true }, order: [['createdAt', 'DESC']], raw: true });
        const me = (0, helpers_1.userId)(req);
        return (0, recordRouter_1.ok)(res, {
            categories: exports.SUGGESTION_CATEGORIES, canManage: mgmt,
            suggestions: rows.map((s) => {
                const votes = Array.isArray(s.voterHashes) ? s.voterHashes : [];
                const { voterHashes, ...rest } = s;
                void voterHashes;
                return { ...rest, id: Number(s.id), votes: votes.length, iVoted: votes.includes(voterHash(me, Number(s.id))) };
            }),
        });
    }));
    const recent = new Map();
    r.post('/suggestions', (0, recordRouter_1.wrap)(async (req, res) => {
        const me = (0, helpers_1.userId)(req);
        const now = Date.now();
        const times = (recent.get(me) || []).filter((t) => now - t < 3600000);
        if (times.length >= 5)
            return (0, recordRouter_1.fail)(res, 429, 'You have sent several suggestions in the last hour — please try again later');
        recent.set(me, [...times, now]);
        const title = String(req.body?.title || '').trim().slice(0, 200);
        const body = String(req.body?.body || '').trim().slice(0, 5000);
        if (!title || body.length < 10)
            return (0, recordRouter_1.fail)(res, 400, 'Give it a title and a few words of detail');
        const category = exports.SUGGESTION_CATEGORIES.includes(req.body?.category) ? req.body.category : 'General';
        const code = `S-${crypto_1.default.randomBytes(3).toString('hex').toUpperCase()}`;
        const row = await models_1.ErpModels.Suggestion.create({ code, category, title, body, status: 'New', isPublic: false, voterHashes: [] });
        await (0, helpers_1.notifyUsers)(null, await (0, helpers_1.userIdsWithRoles)(['superadmin', 'admin', 'hr']), { title: 'New anonymous suggestion', type: 'Other', message: `${category}: “${title}”`, actionUrl: `/suggestions?open=${row.id}` });
        (0, helpers_1.emitChange)(null, 'suggestion', 'created', { id: row.id });
        return (0, recordRouter_1.ok)(res, { code }, `Sent anonymously. Your reference is ${code} — watch the board for a reply.`, 201);
    }));
    r.post('/suggestions/:id(\\d+)/vote', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.Suggestion.findByPk(req.params.id);
        if (!row || (!row.isPublic && !isHR(req)))
            return (0, recordRouter_1.fail)(res, 404, 'Suggestion not found');
        const h = voterHash((0, helpers_1.userId)(req), Number(row.id));
        const votes = Array.isArray(row.voterHashes) ? row.voterHashes : [];
        const next = votes.includes(h) ? votes.filter((v) => v !== h) : [...votes, h];
        await row.update({ voterHashes: next });
        return (0, recordRouter_1.ok)(res, { votes: next.length, iVoted: next.includes(h) });
    }));
    r.put('/suggestions/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only management and HR can respond to suggestions');
        const row = await models_1.ErpModels.Suggestion.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Suggestion not found');
        const b = req.body || {};
        const data = {};
        if (['New', 'Under review', 'Planned', 'Done', 'Not now'].includes(b.status))
            data.status = b.status;
        if (typeof b.isPublic === 'boolean')
            data.isPublic = b.isPublic;
        if (b.reply !== undefined && String(b.reply).trim() !== String(row.reply || ''))
            Object.assign(data, { reply: String(b.reply).trim().slice(0, 5000) || null, repliedByName: (0, helpers_1.userName)(req), repliedAt: new Date() });
        const goingPublic = data.isPublic === true && !row.isPublic;
        await row.update(data);
        if (goingPublic)
            await (0, helpers_1.notifyUsers)(req, await allStaffUserIds(), { title: 'A suggestion has been answered', type: 'Other', message: `“${row.title}” — ${row.status}`, actionUrl: `/suggestions?open=${row.id}` }, { excludeSelf: (0, helpers_1.userId)(req) });
        await (0, helpers_1.audit)(req, 'Suggestions', 'Update', 'Suggestion', row.id, `${(0, helpers_1.userName)(req)} updated suggestion ${row.code} (${row.status}${row.isPublic ? ', on the board' : ''})`);
        (0, helpers_1.emitChange)(req, 'suggestion', 'updated', { id: row.id });
        return (0, recordRouter_1.ok)(res, row, 'Saved');
    }));
    r.delete('/suggestions/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only management can delete suggestions');
        const row = await models_1.ErpModels.Suggestion.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Suggestion not found');
        await row.destroy();
        await (0, helpers_1.audit)(req, 'Suggestions', 'Delete', 'Suggestion', row.id, `${(0, helpers_1.userName)(req)} deleted suggestion ${row.code}`);
        return (0, recordRouter_1.ok)(res, { id: row.id }, 'Deleted');
    }));
    return r;
}
//# sourceMappingURL=recognition.js.map