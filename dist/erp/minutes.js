"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.minutesRouter = minutesRouter;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const cleanPeople = (v) => (Array.isArray(v) ? v : []).map((p) => ({ userId: Number(p?.userId), name: String(p?.name || '').slice(0, 160) })).filter((p) => p.userId && p.name).slice(0, 100);
const cleanActions = (v) => (Array.isArray(v) ? v : []).map((a) => ({
    id: String(a?.id || crypto_1.default.randomBytes(4).toString('hex')), text: String(a?.text || '').trim().slice(0, 500),
    ownerUserId: a?.ownerUserId ? Number(a.ownerUserId) : null, ownerName: a?.ownerName ? String(a.ownerName).slice(0, 160) : null,
    due: /^\d{4}-\d{2}-\d{2}$/.test(String(a?.due || '')) ? String(a.due) : null, taskId: a?.taskId ? Number(a.taskId) : null,
})).filter((a) => a.text).slice(0, 60);
const cleanDecisions = (v) => (Array.isArray(v) ? v : []).map((d) => String(d || '').trim().slice(0, 500)).filter(Boolean).slice(0, 60);
function canSee(req, m) {
    const me = (0, helpers_1.userId)(req);
    return (0, helpers_1.isManagement)(req) || Number(m.createdById) === me || (m.status === 'Shared' && (m.attendees || []).concat(m.apologies || []).some((p) => Number(p.userId) === me))
        || (m.status === 'Shared' && (m.actions || []).some((a) => Number(a.ownerUserId) === me));
}
const canEdit = (req, m) => (0, helpers_1.isManagement)(req) || Number(m.createdById) === (0, helpers_1.userId)(req);
async function staffIdOf(uid) {
    const r = (await q(`SELECT id FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: uid }))[0];
    return r ? Number(r.id) : null;
}
async function createTasks(req, m) {
    const { Task } = require('../models/Task.model');
    const reporter = (await staffIdOf((0, helpers_1.userId)(req))) ?? (0, helpers_1.userId)(req);
    const out = [];
    for (const a of (m.actions || [])) {
        if (a.taskId || !a.ownerUserId) {
            out.push(a);
            continue;
        }
        const assignee = await staffIdOf(Number(a.ownerUserId));
        try {
            const t = await Task.create({
                title: a.text.slice(0, 200), description: `Action point from “${m.title}” (${new Date(m.heldAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}). Minutes: ${m.code}`,
                taskCode: `MIN${Date.now()}${Math.floor(Math.random() * 100)}`, assigneeId: assignee ?? undefined, reporterId: reporter,
                priority: 'Medium', status: 'Todo', dueDate: a.due ? new Date(`${a.due}T17:00:00+01:00`) : undefined, label: 'Meeting action',
            });
            out.push({ ...a, taskId: Number(t.id) });
        }
        catch (e) {
            console.error('[minutes] task failed:', e.message);
            out.push(a);
        }
    }
    return out;
}
function minutesRouter() {
    const r = (0, express_1.Router)();
    r.get('/minutes', (0, recordRouter_1.wrap)(async (req, res) => {
        const rows = await models_1.ErpModels.Minutes.findAll({ order: [['heldAt', 'DESC']], limit: 300, raw: true });
        const visible = rows.filter((m) => canSee(req, m));
        const me = (0, helpers_1.userId)(req);
        const taskIds = visible.flatMap((m) => (m.actions || []).map((a) => a.taskId)).filter(Boolean);
        const tasks = taskIds.length ? await q(`SELECT id, status FROM tasks WHERE id IN (:ids)`, { ids: taskIds }) : [];
        const ts = new Map(tasks.map((t) => [Number(t.id), t.status]));
        return (0, recordRouter_1.ok)(res, visible.map((m) => {
            const actions = (m.actions || []).map((a) => ({ ...a, taskStatus: a.taskId ? ts.get(Number(a.taskId)) || null : null }));
            return {
                ...m, id: Number(m.id), actions, canEdit: canEdit(req, m),
                openActions: actions.filter((a) => !['Done', 'Cancelled'].includes(a.taskStatus)).length,
                myActions: actions.filter((a) => Number(a.ownerUserId) === me && !['Done', 'Cancelled'].includes(a.taskStatus)).length,
            };
        }));
    }));
    r.get('/minutes/meetings', (0, recordRouter_1.wrap)(async (req, res) => {
        const rows = await q(`SELECT m.id, m.title, m."scheduledAt", m."meetingType" FROM meetings m WHERE m."deletedAt" IS NULL AND m."scheduledAt" > NOW() - INTERVAL '60 days'
       AND (m."hostUserId" = :u OR EXISTS (SELECT 1 FROM meeting_participants p WHERE p."meetingId" = m.id AND p."userId" = :u)) ORDER BY m."scheduledAt" DESC LIMIT 40`, { u: (0, helpers_1.userId)(req) }).catch(() => []);
        const out = [];
        for (const m of rows) {
            const people = await q(`SELECT DISTINCT u.id AS "userId", COALESCE(NULLIF(TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')), ''), u.email) AS name
         FROM users u WHERE u.id IN (SELECT "userId" FROM meeting_participants WHERE "meetingId" = :m UNION SELECT "hostUserId" FROM meetings WHERE id = :m)`, { m: m.id }).catch(() => []);
            out.push({ ...m, id: Number(m.id), people: people.map((p) => ({ userId: Number(p.userId), name: p.name })) });
        }
        return (0, recordRouter_1.ok)(res, out);
    }));
    r.post('/minutes', (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        const title = String(b.title || '').trim().slice(0, 200);
        if (!title)
            return (0, recordRouter_1.fail)(res, 400, 'Give the meeting a title');
        const heldAt = b.heldAt ? new Date(b.heldAt) : new Date();
        const row = await models_1.ErpModels.Minutes.create({
            code: await (0, helpers_1.nextCode)('MIN'), title, meetingId: b.meetingId ? Number(b.meetingId) : null, heldAt, location: b.location || null,
            attendees: cleanPeople(b.attendees), apologies: cleanPeople(b.apologies), agenda: b.agenda || null, notes: b.notes || null,
            decisions: cleanDecisions(b.decisions), actions: cleanActions(b.actions), nextMeetingAt: b.nextMeetingAt ? new Date(b.nextMeetingAt) : null,
            status: 'Draft', departmentId: b.departmentId || null, createdById: (0, helpers_1.userId)(req), createdByName: (0, helpers_1.userName)(req),
        });
        await (0, helpers_1.audit)(req, 'Minutes', 'Create', 'Minutes', row.id, `${(0, helpers_1.userName)(req)} wrote minutes for “${title}”`);
        (0, helpers_1.emitChange)(req, 'minutes', 'created', row);
        return (0, recordRouter_1.ok)(res, row, 'Minutes saved', 201);
    }));
    r.put('/minutes/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.Minutes.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Minutes not found');
        if (!canEdit(req, row))
            return (0, recordRouter_1.fail)(res, 403, 'Only the person who wrote the minutes (or management) can change them');
        const b = req.body || {};
        const data = {};
        if (b.title !== undefined)
            data.title = String(b.title).trim().slice(0, 200) || row.title;
        for (const k of ['location', 'agenda', 'notes'])
            if (b[k] !== undefined)
                data[k] = b[k] || null;
        if (b.heldAt)
            data.heldAt = new Date(b.heldAt);
        if (b.nextMeetingAt !== undefined)
            data.nextMeetingAt = b.nextMeetingAt ? new Date(b.nextMeetingAt) : null;
        if (b.meetingId !== undefined)
            data.meetingId = b.meetingId ? Number(b.meetingId) : null;
        if (b.attendees !== undefined)
            data.attendees = cleanPeople(b.attendees);
        if (b.apologies !== undefined)
            data.apologies = cleanPeople(b.apologies);
        if (b.decisions !== undefined)
            data.decisions = cleanDecisions(b.decisions);
        if (b.actions !== undefined) {
            const prev = (row.actions || []);
            const byId = new Map(prev.map((a) => [a.id, a]));
            const byText = new Map(prev.map((a) => [a.text.trim().toLowerCase(), a]));
            data.actions = cleanActions(b.actions).map((a) => ({ ...a, taskId: a.taskId || byId.get(a.id)?.taskId || byText.get(a.text.trim().toLowerCase())?.taskId || null }));
        }
        await row.update(data);
        if (row.status === 'Shared' && b.actions !== undefined) {
            await row.update({ actions: await createTasks(req, row.get({ plain: true })) });
        }
        (0, helpers_1.emitChange)(req, 'minutes', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Minutes saved');
    }));
    r.post('/minutes/:id(\\d+)/share', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.Minutes.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Minutes not found');
        if (!canEdit(req, row))
            return (0, recordRouter_1.fail)(res, 403, 'Only the person who wrote the minutes can share them');
        const plain = row.get({ plain: true });
        const actions = await createTasks(req, plain);
        await row.update({ actions, status: 'Shared', sharedAt: new Date() });
        const people = new Set([...(plain.attendees || []), ...(plain.apologies || [])].map((p) => Number(p.userId)));
        actions.forEach((a) => a.ownerUserId && people.add(Number(a.ownerUserId)));
        await (0, helpers_1.notifyUsers)(req, [...people], {
            title: `Minutes: ${row.title}`, type: 'Other',
            message: `${(plain.decisions || []).length} decision${(plain.decisions || []).length === 1 ? '' : 's'} and ${actions.length} action point${actions.length === 1 ? '' : 's'}. Open to read.`,
            actionUrl: `/minutes?open=${row.id}`,
        }, { excludeSelf: (0, helpers_1.userId)(req) });
        for (const a of actions) {
            if (!a.ownerUserId || a.ownerUserId === (0, helpers_1.userId)(req))
                continue;
            await (0, helpers_1.notifyUsers)(req, [a.ownerUserId], { title: 'Action point for you', type: 'Assignment', message: `${a.text}${a.due ? ` — by ${new Date(a.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''} (from “${row.title}”)`, actionUrl: a.taskId ? `/tasks/${a.taskId}` : `/minutes?open=${row.id}` });
        }
        await (0, helpers_1.audit)(req, 'Minutes', 'Share', 'Minutes', row.id, `${(0, helpers_1.userName)(req)} shared minutes for “${row.title}” (${actions.filter((a) => a.taskId).length} tasks created)`);
        (0, helpers_1.emitChange)(req, 'minutes', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, `Shared — ${actions.filter((a) => a.taskId).length} task${actions.filter((a) => a.taskId).length === 1 ? '' : 's'} created`);
    }));
    r.delete('/minutes/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.Minutes.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Minutes not found');
        if (!canEdit(req, row))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot delete these minutes');
        await row.destroy();
        await (0, helpers_1.audit)(req, 'Minutes', 'Delete', 'Minutes', row.id, `${(0, helpers_1.userName)(req)} deleted minutes “${row.title}”`);
        (0, helpers_1.emitChange)(req, 'minutes', 'deleted', { id: row.id });
        return (0, recordRouter_1.ok)(res, { id: row.id }, 'Minutes deleted');
    }));
    r.post('/minutes/ai-tidy', (0, recordRouter_1.wrap)(async (req, res) => {
        const notes = String(req.body?.notes || '').trim().slice(0, 15000);
        if (notes.length < 20)
            return (0, recordRouter_1.fail)(res, 400, 'Type or paste your rough notes first');
        const people = cleanPeople(req.body?.attendees);
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
        const prompt = `You are writing clear meeting minutes for a Nigerian company. Today is ${today}.
People at the meeting: ${people.map((p) => `${p.name} (id ${p.userId})`).join(', ') || 'not listed'}.
Rough notes:
"""${notes}"""
Return ONLY JSON: {"notes": "a tidy summary of the discussion in short paragraphs or '-' bullets (plain text, no markdown)",
"decisions": ["each decision as one sentence"],
"actions": [{"text": "what must be done, starting with a verb", "ownerUserId": id of the person from the list or null, "due": "YYYY-MM-DD" or null}]}
Only use due dates that the notes state or clearly imply (e.g. "by Friday"). Do not invent facts.`;
        let out;
        try {
            const { getActiveProvider } = require('../modules/ai/providers/ProviderFactory');
            out = await getActiveProvider().generate(prompt, undefined, 0.3);
        }
        catch (e) {
            return (0, recordRouter_1.fail)(res, e.status || 503, e.message || 'The AI could not tidy these notes right now');
        }
        const t = out.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        let j = null;
        try {
            j = JSON.parse(t);
        }
        catch {
            const m = t.match(/\{[\s\S]*\}/);
            if (m)
                try {
                    j = JSON.parse(m[0]);
                }
                catch { }
        }
        if (!j)
            return (0, recordRouter_1.fail)(res, 422, 'The AI reply could not be read — please try again');
        const byId = new Map(people.map((p) => [p.userId, p.name]));
        return (0, recordRouter_1.ok)(res, {
            notes: String(j.notes || '').replace(/\*\*/g, ''), decisions: cleanDecisions(j.decisions),
            actions: cleanActions((j.actions || []).map((a) => ({ ...a, ownerName: a.ownerUserId ? byId.get(Number(a.ownerUserId)) || null : null, ownerUserId: byId.has(Number(a.ownerUserId)) ? Number(a.ownerUserId) : null }))),
        });
    }));
    return r;
}
//# sourceMappingURL=minutes.js.map