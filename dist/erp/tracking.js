"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.track = track;
exports.statusLabel = statusLabel;
exports.trackTaskChange = trackTaskChange;
exports.trackingRouter = trackingRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const TASK_STATUS_LABEL = {
    Todo: 'To do', InProgress: 'In progress', InReview: 'In review', Blocked: 'Blocked', Done: 'Done', Cancelled: 'Cancelled',
};
async function track(req, entityType, entityId, event, content, meta = {}) {
    try {
        await models_1.ErpModels.Activity.create({
            entityType, entityId: Number(entityId), kind: 'Track', content,
            meta: { event, ...meta },
            createdById: req ? (0, helpers_1.userId)(req) || null : null,
            createdByName: req ? (0, helpers_1.userName)(req) : 'System',
        });
        if (req)
            (0, helpers_1.emitChange)(req, `${entityType}_timeline`, 'updated', { id: Number(entityId) });
    }
    catch (e) {
        console.error('[track]', e.message);
    }
}
function statusLabel(s) {
    return TASK_STATUS_LABEL[s] || s;
}
async function staffName(staffId) {
    if (!staffId)
        return 'nobody';
    const r = (await q(`SELECT "firstName", "lastName" FROM staff WHERE id = :id`, { id: Number(staffId) }))[0];
    return r ? `${r.firstName} ${r.lastName}` : 'a staff member';
}
async function trackTaskChange(req, before, after) {
    const steps = [];
    if (before.status !== after.status)
        steps.push(['status', `Status changed from ${statusLabel(before.status)} to ${statusLabel(after.status)}`, { from: before.status, to: after.status }]);
    if (Number(before.progress || 0) !== Number(after.progress || 0))
        steps.push(['progress', `Progress updated to ${Number(after.progress || 0)}%`, { from: before.progress, to: after.progress }]);
    if (String(before.assigneeId || '') !== String(after.assigneeId || ''))
        steps.push(['assigned', `Assigned to ${await staffName(after.assigneeId)}`, { from: before.assigneeId, to: after.assigneeId }]);
    if (String(before.dueDate || '') !== String(after.dueDate || '') && after.dueDate)
        steps.push(['due', `Due date set to ${new Date(after.dueDate).toLocaleDateString('en-GB')}`, {}]);
    if (before.priority !== after.priority)
        steps.push(['priority', `Priority changed to ${after.priority}`, {}]);
    if (before.title !== after.title || before.description !== after.description)
        steps.push(['edited', 'Details edited', {}]);
    for (const [event, text, meta] of steps)
        await track(req, 'task', after.id, event, text, meta);
}
function trackingRouter() {
    const r = (0, express_1.Router)();
    r.get('/timeline/:entityType/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const rows = await q(`SELECT id, kind, content, meta, "createdByName", "createdById", "createdAt" FROM erp_activities
       WHERE "entityType" = :t AND "entityId" = :id ORDER BY "createdAt" ASC, id ASC`, { t: req.params.entityType, id: Number(req.params.id) });
        return (0, recordRouter_1.ok)(res, rows);
    }));
    r.post('/timeline/:entityType/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const note = String(req.body?.note || '').trim().slice(0, 4000);
        const progress = req.body?.progress !== undefined && req.body?.progress !== '' ? Math.max(0, Math.min(100, (0, helpers_1.toNum)(req.body.progress))) : null;
        if (!note && progress === null)
            return (0, recordRouter_1.fail)(res, 400, 'Write an update or set the progress');
        const type = req.params.entityType;
        const id = Number(req.params.id);
        if (type === 'task') {
            const t = (await q(`SELECT id, title, "assigneeId", "reporterId", progress FROM tasks WHERE id = :id AND "deletedAt" IS NULL`, { id }))[0];
            if (!t)
                return (0, recordRouter_1.fail)(res, 404, 'Task not found');
            if (progress !== null)
                await helpers_1.db.query(`UPDATE tasks SET progress = :p, "updatedAt" = NOW() WHERE id = :id`, { replacements: { p: progress, id } });
            const rep = (await q(`SELECT "userId" FROM staff WHERE id = :id`, { id: t.reporterId }))[0];
            if (rep?.userId)
                await (0, helpers_1.notifyUsers)(req, [Number(rep.userId)], { title: `Update on "${t.title}"`, message: `${(0, helpers_1.userName)(req)}: ${note || `progress ${progress}%`}`.slice(0, 240), type: 'Task', actionUrl: `/tasks/${id}` }, { excludeSelf: (0, helpers_1.userId)(req) });
        }
        else if (type === 'project' && progress !== null) {
            await helpers_1.db.query(`UPDATE projects SET progress = :p, "updatedAt" = NOW() WHERE id = :id`, { replacements: { p: progress, id } });
        }
        await track(req, type, id, progress !== null && !note ? 'progress' : 'update', note || `Progress updated to ${progress}%`, progress !== null ? { progress } : {});
        return (0, recordRouter_1.ok)(res, null, 'Update added');
    }));
    r.get('/tracking', (0, recordRouter_1.wrap)(async (req, res) => {
        const me = (0, helpers_1.userId)(req);
        const bucket = (0, helpers_1.roleOf)(req);
        let userFilter = null;
        if (req.query.mine === '1' || !((0, helpers_1.isManagement)(req) || bucket === 'hr' || bucket === 'hod'))
            userFilter = [me];
        else if (bucket === 'hod') {
            const depts = await (0, helpers_1.headedDepartmentIds)(me);
            const users = depts.length ? await q(`SELECT DISTINCT s."userId" FROM staff s LEFT JOIN staff_departments sd ON sd."staffId" = s.id
         WHERE s."deletedAt" IS NULL AND (s."departmentId" IN (:d) OR sd."departmentId" IN (:d))`, { d: depts }) : [];
            userFilter = [...new Set([me, ...users.map((u) => Number(u.userId)).filter(Boolean)])];
        }
        if (req.query.userId && !userFilter)
            userFilter = [Number(req.query.userId)];
        const items = [];
        const tasks = await q(`SELECT t.id, t.title, t.status, t.priority, t.progress, t."dueDate", t."updatedAt", t."createdAt", p.name AS "projectName",
              s."userId" AS "assigneeUserId", s."firstName" || ' ' || s."lastName" AS "assigneeName",
              rs."firstName" || ' ' || rs."lastName" AS "assignedByName"
       FROM tasks t LEFT JOIN staff s ON s.id = t."assigneeId" LEFT JOIN staff rs ON rs.id = t."reporterId" LEFT JOIN projects p ON p.id = t."projectId"
       WHERE t."deletedAt" IS NULL ${userFilter ? 'AND s."userId" IN (:u)' : ''}
       ORDER BY t."updatedAt" DESC LIMIT 400`, { u: userFilter || [0] });
        for (const t of tasks) {
            items.push({
                type: 'task', id: Number(t.id), title: t.title, context: t.projectName || 'Personal task', status: statusLabel(t.status),
                done: ['Done', 'Cancelled'].includes(t.status), blocked: t.status === 'Blocked', priority: t.priority,
                progress: Number(t.progress || 0) || (t.status === 'Done' ? 100 : 0), dueDate: t.dueDate, updatedAt: t.updatedAt,
                assigneeName: t.assigneeName, assigneeUserId: t.assigneeUserId ? Number(t.assigneeUserId) : null, assignedBy: t.assignedByName,
                url: `/tasks/${t.id}`,
            });
        }
        const projects = await q(`SELECT pr.id, pr.name, pr.status, pr.priority, pr.progress, pr."endDate", pr."updatedAt", s."userId" AS "managerUserId", s."firstName" || ' ' || s."lastName" AS "managerName"
       FROM projects pr LEFT JOIN staff s ON s.id = pr."projectManagerId"
       WHERE pr."deletedAt" IS NULL ${userFilter ? 'AND s."userId" IN (:u)' : ''} ORDER BY pr."updatedAt" DESC LIMIT 200`, { u: userFilter || [0] }).catch(() => []);
        for (const p of projects) {
            items.push({
                type: 'project', id: Number(p.id), title: p.name, context: 'Project', status: p.status,
                done: ['Completed', 'Cancelled', 'Archived'].includes(p.status), blocked: p.status === 'OnHold', priority: p.priority,
                progress: Number(p.progress || 0), dueDate: p.endDate, updatedAt: p.updatedAt,
                assigneeName: p.managerName, assigneeUserId: p.managerUserId ? Number(p.managerUserId) : null, url: `/projects/${p.id}`,
            });
        }
        const brandTables = [
            ['travel_case', 'erp_travel_cases', 'customerName', '/visamax/cases', ['Approved', 'Rejected', 'Closed', 'Completed']],
            ['tech_project', 'erp_tech_projects', 'title', '/kurios/solutions', ['Completed', 'Delivered', 'Closed', 'Cancelled']],
            ['support_ticket', 'erp_support_tickets', 'subject', '/kurios/solutions?tab=tickets', ['Resolved', 'Closed']],
            ['custom_order', 'erp_custom_orders', 'title', '/beadmax/custom-orders', ['Delivered', 'Completed', 'Cancelled']],
            ['export_order', 'erp_export_orders', 'customerName', '/maxfood', ['Delivered', 'Cancelled']],
        ];
        for (const [type, table, titleCol, url, doneStages] of brandTables) {
            const cols = new Set((await q(`SELECT column_name FROM information_schema.columns WHERE table_name = :t`, { t: table })).map((c) => c.column_name));
            if (!cols.has('assignedToUserId'))
                continue;
            const tcol = cols.has(titleCol) ? titleCol : cols.has('customerName') ? 'customerName' : 'code';
            const stageCol = cols.has('stage') ? 'stage' : cols.has('status') ? 'status' : null;
            const rows = await q(`SELECT x.id, x.code, x."${tcol}" AS title, ${stageCol ? `x."${stageCol}"` : `''`} AS stage, x."updatedAt", x."assignedToUserId",
                u."firstName" || ' ' || u."lastName" AS "assigneeName", d.name AS dept
         FROM ${table} x LEFT JOIN users u ON u.id = x."assignedToUserId" LEFT JOIN departments d ON d.id = x."departmentId"
         WHERE x."assignedToUserId" IS NOT NULL ${userFilter ? 'AND x."assignedToUserId" IN (:u)' : ''} ORDER BY x."updatedAt" DESC LIMIT 200`, { u: userFilter || [0] }).catch(() => []);
            for (const x of rows) {
                items.push({
                    type, id: Number(x.id), title: `${x.code ? `${x.code} · ` : ''}${x.title || ''}`, context: x.dept || 'Brand record', status: x.stage,
                    done: doneStages.includes(x.stage), blocked: /hold|blocked|issue/i.test(x.stage || ''), priority: null,
                    progress: null, dueDate: null, updatedAt: x.updatedAt,
                    assigneeName: x.assigneeName, assigneeUserId: Number(x.assignedToUserId), url: `${url}${url.includes('?') ? '&' : '?'}open=${x.id}`,
                });
            }
        }
        const now = Date.now();
        for (const it of items)
            it.overdue = !it.done && it.dueDate && new Date(it.dueDate).getTime() < now - 86400000 + 1;
        const summary = {
            total: items.length,
            open: items.filter((i) => !i.done).length,
            overdue: items.filter((i) => i.overdue).length,
            blocked: items.filter((i) => i.blocked && !i.done).length,
            done: items.filter((i) => i.done).length,
        };
        return (0, recordRouter_1.ok)(res, { summary, items });
    }));
    return r;
}
//# sourceMappingURL=tracking.js.map