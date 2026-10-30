"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrap = void 0;
exports.ok = ok;
exports.fail = fail;
exports.scopeWhere = scopeWhere;
exports.canManageRecord = canManageRecord;
exports.clean = clean;
exports.logActivity = logActivity;
exports.brandPrefix = brandPrefix;
exports.nextClientCode = nextClientCode;
exports.buildRecordRouter = buildRecordRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const helpers_1 = require("./helpers");
const outbound_1 = require("./outbound");
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
exports.wrap = wrap;
function ok(res, data, message = 'OK', status = 200) {
    return res.status(status).json({ success: true, message, data, timestamp: new Date().toISOString() });
}
function fail(res, status, message) {
    return res.status(status).json({ success: false, message, error: { message }, timestamp: new Date().toISOString() });
}
async function scopeWhere(req) {
    if ((0, helpers_1.isManagement)(req))
        return null;
    const uid = (0, helpers_1.userId)(req);
    const depts = new Set(await (0, helpers_1.memberDepartmentIds)(uid));
    if ((0, helpers_1.roleOf)(req) === 'hod')
        (await (0, helpers_1.headedDepartmentIds)(uid)).forEach((d) => depts.add(d));
    if (!depts.size)
        return null;
    return {
        [sequelize_1.Op.or]: [
            { departmentId: { [sequelize_1.Op.in]: [...depts] } },
            { departmentId: null },
            { assignedToUserId: uid },
            { createdById: uid },
        ],
    };
}
async function canManageRecord(req, row) {
    if ((0, helpers_1.isManagement)(req))
        return true;
    const uid = (0, helpers_1.userId)(req);
    if (Number(row.createdById) === uid || Number(row.assignedToUserId) === uid)
        return true;
    const scope = await scopeWhere(req);
    if (!scope)
        return true;
    if ((0, helpers_1.roleOf)(req) === 'hod')
        return !row.departmentId || (await (0, helpers_1.headedDepartmentIds)(uid)).includes(Number(row.departmentId)) || (await (0, helpers_1.memberDepartmentIds)(uid)).includes(Number(row.departmentId));
    return !row.departmentId || (await (0, helpers_1.memberDepartmentIds)(uid)).includes(Number(row.departmentId));
}
async function canDelete(req, row) {
    if ((0, helpers_1.isManagement)(req))
        return true;
    if ((0, helpers_1.roleOf)(req) === 'hod')
        return !row.departmentId || (await (0, helpers_1.headedDepartmentIds)((0, helpers_1.userId)(req))).includes(Number(row.departmentId));
    return false;
}
const PROTECTED = ['id', 'code', 'createdById', 'createdAt', 'updatedAt'];
function clean(body, model, extraBlocked = []) {
    const defs = model.getAttributes();
    const attrs = Object.keys(defs);
    const out = {};
    for (const [k, v] of Object.entries(body || {})) {
        if (!attrs.includes(k) || PROTECTED.includes(k) || extraBlocked.includes(k))
            continue;
        const blank = v === '' || v === null;
        if (blank && defs[k].allowNull === false) {
            if (defs[k].defaultValue !== undefined)
                out[k] = defs[k].defaultValue;
            continue;
        }
        out[k] = blank ? null : v;
    }
    return out;
}
async function logActivity(req, entityType, entityId, departmentId, kind, content, meta, channel) {
    return models_1.ErpModels.Activity.create({
        entityType, entityId, departmentId: departmentId || null, kind, content, meta, channel,
        createdById: (0, helpers_1.userId)(req) || null, createdByName: req ? (0, helpers_1.userName)(req) : 'System',
    });
}
async function brandPrefix(departmentId) {
    const b = await (0, outbound_1.brandForDepartment)(departmentId ? Number(departmentId) : null);
    return b.receiptPrefix || 'MXH';
}
async function nextClientCode(departmentId) {
    return (0, helpers_1.nextCode)(`${await brandPrefix(departmentId)}-CLT`);
}
function buildRecordRouter(cfg) {
    const router = (0, express_1.Router)();
    const M = () => models_1.ErpModels[cfg.model];
    const stageField = cfg.stageField || 'stage';
    router.get('/', (0, exports.wrap)(async (req, res) => {
        const where = {};
        const and = [];
        const scope = await scopeWhere(req);
        if (scope)
            and.push(scope);
        const dept = await (0, helpers_1.resolveDepartmentId)(req.query.brand ?? req.query.departmentId);
        if (dept)
            where.departmentId = { [sequelize_1.Op.in]: await (0, helpers_1.departmentFamily)(dept) };
        for (const f of cfg.filterFields || [])
            if (req.query[f] !== undefined && req.query[f] !== '')
                where[f] = req.query[f];
        if (req.query.assignedToMe === 'true')
            where.assignedToUserId = (0, helpers_1.userId)(req);
        const qtext = String(req.query.q || req.query.search || '').trim();
        if (qtext)
            and.push({ [sequelize_1.Op.or]: ['code', ...cfg.searchFields].map((f) => ({ [f]: { [sequelize_1.Op.iLike]: `%${qtext}%` } })) });
        if (and.length)
            where[sequelize_1.Op.and] = and;
        const limit = Math.min((0, helpers_1.toNum)(req.query.limit, 50), 500);
        const page = Math.max((0, helpers_1.toNum)(req.query.page, 1), 1);
        const sortField = Object.keys(M().getAttributes()).includes(String(req.query.sortBy)) ? String(req.query.sortBy) : 'createdAt';
        const sortDir = String(req.query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const { rows, count } = await M().findAndCountAll({ where, limit, offset: (page - 1) * limit, order: [[sortField, sortDir]] });
        let stageCounts = {};
        if (cfg.stages) {
            const cw = { ...where };
            delete cw[stageField];
            const grouped = await M().findAll({ where: cw, attributes: [stageField, [M().sequelize.fn('COUNT', '*'), 'n']], group: [stageField], raw: true });
            stageCounts = Object.fromEntries(grouped.map((g) => [g[stageField], Number(g.n)]));
        }
        return ok(res, { items: rows, total: count, page, limit, stages: cfg.stages || [], stageCounts });
    }));
    router.get('/meta', (0, exports.wrap)(async (_req, res) => ok(res, { stages: cfg.stages || [], label: cfg.label })));
    router.get('/:id(\\d+)', (0, exports.wrap)(async (req, res) => {
        const row = await M().findByPk(req.params.id);
        if (!row)
            return fail(res, 404, `${cfg.label} not found`);
        if (!(await canManageRecord(req, row)) && (await scopeWhere(req))) {
            const visible = await M().count({ where: { [sequelize_1.Op.and]: [{ id: row.id }, (await scopeWhere(req))] } });
            if (!visible)
                return fail(res, 403, 'You do not have access to this record');
        }
        const activities = await models_1.ErpModels.Activity.findAll({ where: { entityType: cfg.entity, entityId: row.id }, order: [['createdAt', 'DESC']], limit: 200 });
        const payments = await models_1.ErpModels.Payment.findAll({ where: { relatedType: cfg.entity, relatedId: row.id }, order: [['paidAt', 'DESC']] });
        return ok(res, { ...row.toJSON(), activities, payments, amountPaid: payments.filter((p) => p.status === 'Completed').reduce((s, p) => s + Number(p.amount), 0) });
    }));
    router.post('/', (0, exports.wrap)(async (req, res) => {
        const data = clean(req.body, M(), cfg.readOnlyFields);
        data.departmentId = (await (0, helpers_1.resolveDepartmentId)(req.body.brand ?? req.body.departmentId)) ?? (cfg.defaultBrand ? await (0, helpers_1.resolveDepartmentId)(cfg.defaultBrand) : null);
        data.createdById = (0, helpers_1.userId)(req);
        if (cfg.beforeSave)
            await cfg.beforeSave(data, null, req);
        data.code = await (0, helpers_1.nextCode)(`${await brandPrefix(data.departmentId)}-${cfg.codeSuffix}`);
        const row = await M().create(data);
        await logActivity(req, cfg.entity, row.id, row.departmentId, 'System', `${cfg.label} ${row.code} created by ${(0, helpers_1.userName)(req)}`);
        await (0, helpers_1.audit)(req, 'erp', 'create', cfg.entity, row.id, `${cfg.label} ${row.code} created`, data);
        if (row.assignedToUserId && Number(row.assignedToUserId) !== (0, helpers_1.userId)(req)) {
            await (0, helpers_1.notifyUsers)(req, [Number(row.assignedToUserId)], { title: `New ${cfg.label} assigned`, message: `${row.code} has been assigned to you.`, type: 'Assignment', actionUrl: cfg.actionUrl?.(row), entityType: cfg.entity, entityId: row.id });
        }
        (0, helpers_1.emitChange)(req, cfg.entity, 'created', row);
        return ok(res, row, `${cfg.label} created`, 201);
    }));
    const updateHandler = (0, exports.wrap)(async (req, res) => {
        const row = await M().findByPk(req.params.id);
        if (!row)
            return fail(res, 404, `${cfg.label} not found`);
        if (!(await canManageRecord(req, row)))
            return fail(res, 403, 'You cannot edit this record');
        const data = clean(req.body, M(), [...(cfg.readOnlyFields || []), stageField]);
        if (req.body.brand !== undefined || req.body.departmentId !== undefined)
            data.departmentId = await (0, helpers_1.resolveDepartmentId)(req.body.brand ?? req.body.departmentId);
        if (cfg.beforeSave)
            await cfg.beforeSave(data, row, req);
        const prevAssignee = row.assignedToUserId;
        await row.update(data);
        await (0, helpers_1.audit)(req, 'erp', 'update', cfg.entity, row.id, `${cfg.label} ${row.code} updated`, data);
        if (row.assignedToUserId && String(row.assignedToUserId) !== String(prevAssignee) && Number(row.assignedToUserId) !== (0, helpers_1.userId)(req)) {
            await (0, helpers_1.notifyUsers)(req, [Number(row.assignedToUserId)], { title: `${cfg.label} assigned to you`, message: `${row.code} is now assigned to you.`, type: 'Assignment', actionUrl: cfg.actionUrl?.(row), entityType: cfg.entity, entityId: row.id });
        }
        (0, helpers_1.emitChange)(req, cfg.entity, 'updated', row);
        return ok(res, row, `${cfg.label} updated`);
    });
    router.put('/:id(\\d+)', updateHandler);
    router.patch('/:id(\\d+)', updateHandler);
    if (cfg.stages) {
        router.patch('/:id(\\d+)/stage', (0, exports.wrap)(async (req, res) => {
            const row = await M().findByPk(req.params.id);
            if (!row)
                return fail(res, 404, `${cfg.label} not found`);
            if (!(await canManageRecord(req, row)))
                return fail(res, 403, 'You cannot update this record');
            const to = String(req.body.stage || req.body.status || '');
            if (!cfg.stages.includes(to))
                return fail(res, 400, `Stage must be one of: ${cfg.stages.join(', ')}`);
            const from = row[stageField];
            if (from === to)
                return ok(res, row, 'No change');
            await row.update({ [stageField]: to });
            const note = req.body.note ? ` — ${String(req.body.note)}` : '';
            await logActivity(req, cfg.entity, row.id, row.departmentId, 'StageChange', `${from} → ${to}${note}`, { from, to });
            await (0, helpers_1.audit)(req, 'erp', 'stage', cfg.entity, row.id, `${row.code}: ${from} → ${to}`);
            if (cfg.afterStage)
                await cfg.afterStage(row, from, to, req);
            const watchers = [Number(row.assignedToUserId), Number(row.createdById), ...(await (0, helpers_1.departmentHeadUserIds)(row.departmentId))];
            await (0, helpers_1.notifyUsers)(req, watchers, { title: `${row.code} moved to ${to}`, message: `${(0, helpers_1.userName)(req)} moved ${cfg.label.toLowerCase()} ${row.code} from ${from} to ${to}.`, actionUrl: cfg.actionUrl?.(row), entityType: cfg.entity, entityId: row.id }, { excludeSelf: (0, helpers_1.userId)(req) });
            (0, helpers_1.emitChange)(req, cfg.entity, 'stage', row);
            return ok(res, row, `Moved to ${to}`);
        }));
    }
    router.post('/:id(\\d+)/activities', (0, exports.wrap)(async (req, res) => {
        const row = await M().findByPk(req.params.id);
        if (!row)
            return fail(res, 404, `${cfg.label} not found`);
        const content = String(req.body.content || '').trim();
        if (!content)
            return fail(res, 400, 'Note cannot be empty');
        const act = await logActivity(req, cfg.entity, row.id, row.departmentId, req.body.kind === 'Call' ? 'Call' : 'Note', content);
        (0, helpers_1.emitChange)(req, cfg.entity, 'activity', row);
        return ok(res, act, 'Saved', 201);
    }));
    router.post('/:id(\\d+)/message', (0, exports.wrap)(async (req, res) => {
        const row = await M().findByPk(req.params.id);
        if (!row)
            return fail(res, 404, `${cfg.label} not found`);
        const channel = String(req.body.channel || 'WhatsApp');
        const text = String(req.body.message || '').trim();
        if (!text)
            return fail(res, 400, 'Message cannot be empty');
        const brand = await (0, outbound_1.brandForDepartment)(row.departmentId);
        const result = {};
        if (channel === 'Email' || channel === 'Both') {
            if (!row.customerEmail)
                return fail(res, 400, 'This customer has no email address');
            const subject = String(req.body.subject || `${brand.displayName} — ${row.code}`);
            result.email = await (0, outbound_1.sendBrandEmail)(brand, row.customerEmail, subject, (0, outbound_1.brandEmailHtml)(brand, subject, `<p>Dear ${(0, outbound_1.escapeHtml)(row.customerName)},</p><p style="white-space:pre-line">${(0, outbound_1.escapeHtml)(text)}</p><p>Regards,<br/>${(0, outbound_1.escapeHtml)((0, helpers_1.userName)(req))}<br/>${(0, outbound_1.escapeHtml)(brand.displayName)}</p>`));
        }
        if (channel === 'WhatsApp' || channel === 'Both') {
            const phone = row.customerWhatsapp || row.customerPhone;
            if (!phone)
                return fail(res, 400, 'This customer has no phone/WhatsApp number');
            result.whatsapp = await (0, outbound_1.sendWhatsAppText)(phone, `${text}\n\n— ${(0, helpers_1.userName)(req)}, ${brand.displayName}`);
        }
        await logActivity(req, cfg.entity, row.id, row.departmentId, 'Message', text, { result, subject: req.body.subject }, channel);
        (0, helpers_1.emitChange)(req, cfg.entity, 'activity', row);
        return ok(res, result, 'Message processed');
    }));
    router.delete('/:id(\\d+)', (0, exports.wrap)(async (req, res) => {
        const row = await M().findByPk(req.params.id);
        if (!row)
            return fail(res, 404, `${cfg.label} not found`);
        if (!(await canDelete(req, row)))
            return fail(res, 403, 'Only Admin or the Head of Department can delete this record');
        await row.destroy();
        await (0, helpers_1.audit)(req, 'erp', 'delete', cfg.entity, row.id, `${cfg.label} ${row.code} deleted`);
        (0, helpers_1.emitChange)(req, cfg.entity, 'deleted', row);
        return ok(res, null, `${cfg.label} deleted`);
    }));
    return router;
}
//# sourceMappingURL=recordRouter.js.map