"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRAINING_KINDS = exports.POLICY_CATEGORIES = void 0;
exports.trainingExpiryReminders = trainingExpiryReminders;
exports.policyReminders = policyReminders;
exports.complianceRouter = complianceRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const isHR = (req) => (0, helpers_1.isManagement)(req) || (0, helpers_1.roleOf)(req) === 'hr';
exports.POLICY_CATEGORIES = ['Code of conduct', 'HR & leave', 'Health & safety', 'IT & data protection', 'Finance & expenses', 'Customer service', 'Brand guidelines', 'General'];
exports.TRAINING_KINDS = ['Course', 'Certificate', 'Licence', 'Workshop', 'On-the-job'];
async function brandFamilyIds(deptId) {
    const { brandMap } = require('./profit');
    const { map } = await brandMap();
    const top = map.get(Number(deptId)) ?? Number(deptId);
    const ids = [];
    for (const [d, t] of map.entries())
        if (t === top)
            ids.push(d);
    return ids.length ? ids : [Number(deptId)];
}
async function audience(policy) {
    const ids = policy.departmentId ? await brandFamilyIds(Number(policy.departmentId)) : null;
    const rows = await q(`SELECT DISTINCT s."userId", s.id AS "staffId", CONCAT(s."firstName", ' ', s."lastName") AS name, d.name AS "departmentName"
     FROM staff s JOIN users u ON u.id = s."userId" AND u."deletedAt" IS NULL
     LEFT JOIN departments d ON d.id = s."departmentId"
     WHERE s."deletedAt" IS NULL AND s.status = 'Active' AND s."userId" IS NOT NULL
     ${ids ? `AND (s."departmentId" IN (:ids) OR EXISTS (SELECT 1 FROM staff_departments sd WHERE sd."staffId" = s.id AND sd."departmentId" IN (:ids)))` : ''}
     ORDER BY name`, { ids: ids || [0] });
    return rows.map((r) => ({ userId: Number(r.userId), staffId: Number(r.staffId), name: r.name, departmentName: r.departmentName }));
}
async function ackedUserIds(policy) {
    const rows = await q(`SELECT "userId", "createdAt" FROM erp_policy_acks WHERE "policyId" = :p AND version = :v`, { p: policy.id, v: policy.version });
    return new Map(rows.map((r) => [Number(r.userId), r.createdAt]));
}
async function myStaff(uid) {
    return (await q(`SELECT id, "departmentId", CONCAT("firstName", ' ', "lastName") AS name FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: uid }))[0] || null;
}
function expiryState(expiresOn) {
    if (!expiresOn)
        return null;
    const days = Math.floor((new Date(expiresOn).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
    if (days < 0)
        return 'Expired';
    if (days <= 30)
        return 'Expiring soon';
    return 'Valid';
}
async function trainingExpiryReminders() {
    const rows = await q(`SELECT t.*, s."userId", CONCAT(s."firstName", ' ', s."lastName") AS "staffName" FROM erp_training_records t JOIN staff s ON s.id = t."staffId"
     WHERE t."expiresOn" IS NOT NULL AND s."deletedAt" IS NULL AND s.status = 'Active'
       AND ((t."expiresOn" < CURRENT_DATE AND COALESCE(t."remindedFor", '') <> 'expired')
         OR (t."expiresOn" BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND t."remindedFor" IS NULL))`);
    const hr = await (0, helpers_1.userIdsWithRoles)(['hr']);
    for (const t of rows) {
        const expired = new Date(t.expiresOn) < new Date(new Date().toDateString());
        const when = new Date(t.expiresOn).toLocaleDateString('en-GB', { dateStyle: 'medium' });
        if (t.userId)
            await (0, helpers_1.notifyUsers)(null, [Number(t.userId)], { title: expired ? 'Certificate expired' : 'Certificate expiring soon', type: 'Reminder', message: `Your “${t.title}” ${expired ? 'expired on' : 'expires on'} ${when}. Please renew it and update your training record.`, actionUrl: '/training-records?mine=1' });
        await (0, helpers_1.notifyUsers)(null, hr, { title: expired ? 'Staff certificate expired' : 'Staff certificate expiring', type: 'Reminder', message: `${t.staffName}: “${t.title}” ${expired ? 'expired on' : 'expires on'} ${when}.`, actionUrl: `/training-records?staff=${t.staffId}` });
        await helpers_1.db.query(`UPDATE erp_training_records SET "remindedFor" = :r WHERE id = :id`, { replacements: { r: expired ? 'expired' : '30d', id: t.id } });
    }
    return rows.length;
}
async function policyReminders() {
    const policies = await q(`SELECT * FROM erp_policies WHERE status = 'Published'`);
    const pending = new Map();
    for (const p of policies) {
        const acked = await ackedUserIds(p);
        for (const a of await audience(p))
            if (!acked.has(a.userId))
                pending.set(a.userId, [...(pending.get(a.userId) || []), p.title]);
    }
    for (const [uid, titles] of pending) {
        await (0, helpers_1.notifyUsers)(null, [uid], { title: 'Policies waiting for you', type: 'Reminder', message: `Please read and accept: ${titles.slice(0, 3).join(', ')}${titles.length > 3 ? ` and ${titles.length - 3} more` : ''}.`, actionUrl: '/policies' });
    }
    return pending.size;
}
function complianceRouter() {
    const r = (0, express_1.Router)();
    r.get('/policies/meta', (0, recordRouter_1.wrap)(async (_req, res) => (0, recordRouter_1.ok)(res, { categories: exports.POLICY_CATEGORIES })));
    r.get('/policies', (0, recordRouter_1.wrap)(async (req, res) => {
        const me = (0, helpers_1.userId)(req);
        const hr = isHR(req);
        const rows = await models_1.ErpModels.Policy.findAll({ where: hr ? {} : { status: 'Published' }, order: [['status', 'DESC'], ['publishedAt', 'DESC'], ['id', 'DESC']], raw: true });
        const { brandDepartments } = require('./people');
        const brands = new Map((await brandDepartments()).map((b) => [b.id, b.displayName]));
        const out = [];
        for (const p of rows) {
            const people = await audience(p);
            const forMe = people.some((a) => a.userId === me);
            if (!hr && !forMe)
                continue;
            const acked = await ackedUserIds(p);
            const accepted = people.filter((a) => acked.has(a.userId)).length;
            out.push({
                ...p, brandName: p.departmentId ? brands.get(Number(p.departmentId)) || null : null, forMe,
                myAcceptedAt: acked.get(me) || null, accepted, total: people.length,
                overdue: !!(p.acceptBy && forMe && !acked.has(me) && new Date(p.acceptBy) < new Date(new Date().toDateString())),
            });
        }
        return (0, recordRouter_1.ok)(res, { policies: out, canManage: hr });
    }));
    r.get('/policies/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const p = await models_1.ErpModels.Policy.findByPk(req.params.id, { raw: true });
        if (!p || (p.status !== 'Published' && !isHR(req)))
            return (0, recordRouter_1.fail)(res, 404, 'Policy not found');
        const acked = await ackedUserIds(p);
        const people = await audience(p);
        const out = { ...p, myAcceptedAt: acked.get((0, helpers_1.userId)(req)) || null, forMe: people.some((a) => a.userId === (0, helpers_1.userId)(req)) };
        if (isHR(req))
            out.people = people.map((a) => ({ ...a, acceptedAt: acked.get(a.userId) || null }));
        return (0, recordRouter_1.ok)(res, out);
    }));
    const cleanPolicy = (b) => ({
        title: String(b.title || '').trim().slice(0, 200),
        category: exports.POLICY_CATEGORIES.includes(b.category) ? b.category : 'General',
        summary: b.summary ? String(b.summary).slice(0, 1000) : null,
        body: b.body ? String(b.body).slice(0, 100000) : null,
        fileUrl: b.fileUrl ? String(b.fileUrl).slice(0, 1000) : null,
        departmentId: b.departmentId ? Number(b.departmentId) : null,
        acceptBy: b.acceptBy || null,
    });
    async function announce(req, p, again = false) {
        const people = await audience(p);
        await (0, helpers_1.notifyUsers)(req, people.map((a) => a.userId), {
            title: again ? 'A policy has been updated' : 'New policy to read', type: 'Announcement', priority: 'High',
            message: `Please read and accept “${p.title}”${p.acceptBy ? ` by ${new Date(p.acceptBy).toLocaleDateString('en-GB', { dateStyle: 'medium' })}` : ''}.`,
            actionUrl: `/policies?open=${p.id}`,
        }, { excludeSelf: (0, helpers_1.userId)(req) });
    }
    r.post('/policies', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can add policies');
        const data = cleanPolicy(req.body || {});
        if (!data.title)
            return (0, recordRouter_1.fail)(res, 400, 'Give the policy a title');
        if (!data.body && !data.fileUrl)
            return (0, recordRouter_1.fail)(res, 400, 'Write the policy or attach the document');
        const publish = !!req.body?.publish;
        const p = await models_1.ErpModels.Policy.create({ ...data, status: publish ? 'Published' : 'Draft', publishedAt: publish ? new Date() : null, createdById: (0, helpers_1.userId)(req) });
        if (publish)
            await announce(req, p);
        await (0, helpers_1.audit)(req, 'Policies', 'Create', 'Policy', p.id, `${(0, helpers_1.userName)(req)} ${publish ? 'published' : 'drafted'} policy “${p.title}”`);
        (0, helpers_1.emitChange)(req, 'policy', 'created', p);
        return (0, recordRouter_1.ok)(res, p, publish ? 'Policy published — everyone has been asked to accept it' : 'Draft saved', 201);
    }));
    r.put('/policies/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can change policies');
        const p = await models_1.ErpModels.Policy.findByPk(req.params.id);
        if (!p)
            return (0, recordRouter_1.fail)(res, 404, 'Policy not found');
        const data = cleanPolicy({ ...p.get({ plain: true }), ...req.body });
        const newVersion = !!req.body?.newVersion && p.status === 'Published';
        if (newVersion)
            data.version = Number(p.version) + 1;
        if (req.body?.publish && p.status !== 'Published')
            Object.assign(data, { status: 'Published', publishedAt: new Date() });
        await p.update(data);
        if (newVersion || data.status === 'Published' && req.body?.publish)
            await announce(req, p, newVersion);
        await (0, helpers_1.audit)(req, 'Policies', 'Update', 'Policy', p.id, `${(0, helpers_1.userName)(req)} updated policy “${p.title}”${newVersion ? ` (version ${p.version}, everyone must accept again)` : ''}`);
        (0, helpers_1.emitChange)(req, 'policy', 'updated', p);
        return (0, recordRouter_1.ok)(res, p, newVersion ? `Saved as version ${p.version} — everyone has been asked to accept again` : data.status === 'Published' && req.body?.publish ? 'Policy published' : 'Policy saved');
    }));
    r.post('/policies/:id(\\d+)/accept', (0, recordRouter_1.wrap)(async (req, res) => {
        const p = await models_1.ErpModels.Policy.findByPk(req.params.id, { raw: true });
        if (!p || p.status !== 'Published')
            return (0, recordRouter_1.fail)(res, 404, 'Policy not found');
        const me = (0, helpers_1.userId)(req);
        if (!(await audience(p)).some((a) => a.userId === me))
            return (0, recordRouter_1.fail)(res, 403, 'This policy is not addressed to you');
        const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 64);
        await helpers_1.db.query(`INSERT INTO erp_policy_acks ("policyId", version, "userId", name, ip, "createdAt", "updatedAt") VALUES (:p, :v, :u, :n, :ip, NOW(), NOW())
       ON CONFLICT ("policyId", version, "userId") DO NOTHING`, { replacements: { p: p.id, v: p.version, u: me, n: (0, helpers_1.userName)(req), ip } });
        await (0, helpers_1.audit)(req, 'Policies', 'Accept', 'Policy', p.id, `${(0, helpers_1.userName)(req)} accepted “${p.title}” (version ${p.version})`);
        (0, helpers_1.emitChange)(req, 'policy', 'updated', { id: p.id });
        return (0, recordRouter_1.ok)(res, { acceptedAt: new Date() }, 'Thank you — your acceptance is recorded');
    }));
    r.post('/policies/:id(\\d+)/remind', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can send reminders');
        const p = await models_1.ErpModels.Policy.findByPk(req.params.id, { raw: true });
        if (!p || p.status !== 'Published')
            return (0, recordRouter_1.fail)(res, 404, 'Policy not found');
        const acked = await ackedUserIds(p);
        const pending = (await audience(p)).filter((a) => !acked.has(a.userId));
        await (0, helpers_1.notifyUsers)(req, pending.map((a) => a.userId), { title: 'Reminder: policy to accept', type: 'Reminder', priority: 'High', message: `Please read and accept “${p.title}”.`, actionUrl: `/policies?open=${p.id}` });
        return (0, recordRouter_1.ok)(res, { reminded: pending.length }, pending.length ? `Reminder sent to ${pending.length} ${pending.length === 1 ? 'person' : 'people'}` : 'Everyone has accepted');
    }));
    r.post('/policies/:id(\\d+)/archive', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can archive policies');
        const p = await models_1.ErpModels.Policy.findByPk(req.params.id);
        if (!p)
            return (0, recordRouter_1.fail)(res, 404, 'Policy not found');
        await p.update({ status: p.status === 'Archived' ? 'Published' : 'Archived' });
        await (0, helpers_1.audit)(req, 'Policies', 'Update', 'Policy', p.id, `${(0, helpers_1.userName)(req)} ${p.status === 'Archived' ? 'archived' : 'restored'} “${p.title}”`);
        (0, helpers_1.emitChange)(req, 'policy', 'updated', p);
        return (0, recordRouter_1.ok)(res, p, p.status === 'Archived' ? 'Policy archived' : 'Policy restored');
    }));
    r.delete('/policies/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only management can delete policies');
        const p = await models_1.ErpModels.Policy.findByPk(req.params.id);
        if (!p)
            return (0, recordRouter_1.fail)(res, 404, 'Policy not found');
        await helpers_1.db.query(`DELETE FROM erp_policy_acks WHERE "policyId" = :p`, { replacements: { p: p.id } });
        await p.destroy();
        await (0, helpers_1.audit)(req, 'Policies', 'Delete', 'Policy', p.id, `${(0, helpers_1.userName)(req)} deleted policy “${p.title}”`);
        (0, helpers_1.emitChange)(req, 'policy', 'deleted', { id: p.id });
        return (0, recordRouter_1.ok)(res, { id: p.id }, 'Policy deleted');
    }));
    async function trainingScope(req) {
        const me = await myStaff((0, helpers_1.userId)(req));
        if (isHR(req))
            return { all: true, depts: [], myStaffId: me ? Number(me.id) : null };
        return { all: false, depts: await (0, helpers_1.headedDepartmentIds)((0, helpers_1.userId)(req)), myStaffId: me ? Number(me.id) : null };
    }
    async function canManageStaff(req, staffId) {
        const s = await trainingScope(req);
        if (s.all)
            return true;
        if (!s.depts.length)
            return false;
        const st = (await q(`SELECT "departmentId" FROM staff WHERE id = :id`, { id: staffId }))[0];
        return !!st && s.depts.includes(Number(st.departmentId));
    }
    r.get('/training-records', (0, recordRouter_1.wrap)(async (req, res) => {
        const s = await trainingScope(req);
        const conds = ['s."deletedAt" IS NULL'];
        const R = { depts: s.depts.length ? s.depts : [0], me: s.myStaffId || 0 };
        if (!s.all)
            conds.push(s.depts.length ? '(s."departmentId" IN (:depts) OR t."staffId" = :me)' : 't."staffId" = :me');
        if (req.query.staffId) {
            conds.push('t."staffId" = :sid');
            R.sid = Number(req.query.staffId);
        }
        if (req.query.mine === '1')
            conds.push('t."staffId" = :me');
        const rows = await q(`SELECT t.*, CONCAT(s."firstName", ' ', s."lastName") AS "staffName", s.position, d.name AS "departmentName"
       FROM erp_training_records t JOIN staff s ON s.id = t."staffId" LEFT JOIN departments d ON d.id = s."departmentId"
       WHERE ${conds.join(' AND ')} ORDER BY COALESCE(t."completedOn", t."startDate", t."createdAt"::date) DESC`, R);
        const records = rows.map((t) => ({
            ...t, id: Number(t.id), staffId: Number(t.staffId), cost: t.cost != null ? Number(t.cost) : null, expiry: expiryState(t.expiresOn),
            canEdit: s.all || Number(t.staffId) === s.myStaffId && !t.verified || (!s.all && s.depts.length > 0 && Number(t.staffId) !== s.myStaffId),
        }));
        let people = [];
        if (s.all || s.depts.length) {
            people = await q(`SELECT s.id, CONCAT(s."firstName", ' ', s."lastName") AS name, s.position, d.name AS "departmentName" FROM staff s LEFT JOIN departments d ON d.id = s."departmentId"
         WHERE s."deletedAt" IS NULL AND s.status = 'Active' ${s.all ? '' : 'AND s."departmentId" IN (:depts)'} ORDER BY name`, R);
        }
        const summary = {
            total: records.length, expired: records.filter((r) => r.expiry === 'Expired').length,
            expiringSoon: records.filter((r) => r.expiry === 'Expiring soon').length, toVerify: records.filter((r) => !r.verified).length,
            spend: records.filter((r) => r.paidByCompany && r.currency === 'NGN').reduce((t, r) => t + (r.cost || 0), 0),
        };
        return (0, recordRouter_1.ok)(res, { records, people: people.map((p) => ({ ...p, id: Number(p.id) })), summary, myStaffId: s.myStaffId, canManage: s.all || s.depts.length > 0, kinds: exports.TRAINING_KINDS });
    }));
    const cleanTraining = (b) => ({
        title: String(b.title || '').trim().slice(0, 200),
        kind: exports.TRAINING_KINDS.includes(b.kind) ? b.kind : 'Course',
        provider: b.provider ? String(b.provider).slice(0, 160) : null,
        startDate: b.startDate || null, completedOn: b.completedOn || null, expiresOn: b.expiresOn || null,
        status: ['Planned', 'In progress', 'Completed'].includes(b.status) ? b.status : 'Completed',
        certificateUrl: b.certificateUrl ? String(b.certificateUrl).slice(0, 1000) : null,
        cost: b.cost === '' || b.cost == null ? null : Math.max(0, (0, helpers_1.toNum)(b.cost)),
        currency: String(b.currency || 'NGN').toUpperCase().slice(0, 3),
        paidByCompany: !!b.paidByCompany,
        notes: b.notes ? String(b.notes).slice(0, 3000) : null,
    });
    r.post('/training-records', (0, recordRouter_1.wrap)(async (req, res) => {
        const s = await trainingScope(req);
        const staffId = Number(req.body?.staffId) || s.myStaffId;
        if (!staffId)
            return (0, recordRouter_1.fail)(res, 400, 'Choose the staff member');
        const own = staffId === s.myStaffId;
        const manager = await canManageStaff(req, staffId);
        if (!own && !manager)
            return (0, recordRouter_1.fail)(res, 403, 'You can only add your own training');
        const data = cleanTraining(req.body || {});
        if (!data.title)
            return (0, recordRouter_1.fail)(res, 400, 'Enter the course or certificate name');
        const verified = manager && !own || isHR(req);
        const row = await models_1.ErpModels.TrainingRecord.create({ ...data, staffId, verified, verifiedByName: verified ? (0, helpers_1.userName)(req) : null, createdById: (0, helpers_1.userId)(req) });
        if (!verified)
            await (0, helpers_1.notifyUsers)(req, await (0, helpers_1.userIdsWithRoles)(['hr']), { title: 'Training record to check', type: 'Approval', message: `${(0, helpers_1.userName)(req)} added “${data.title}”. Please check the certificate and verify it.`, actionUrl: `/training-records?staff=${staffId}` }, { excludeSelf: (0, helpers_1.userId)(req) });
        await (0, helpers_1.audit)(req, 'Training', 'Create', 'TrainingRecord', row.id, `${(0, helpers_1.userName)(req)} added training “${data.title}”`);
        (0, helpers_1.emitChange)(req, 'training_record', 'created', row);
        return (0, recordRouter_1.ok)(res, row, verified ? 'Training record saved' : 'Saved — HR will verify it', 201);
    }));
    r.put('/training-records/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.TrainingRecord.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Record not found');
        const s = await trainingScope(req);
        const own = Number(row.staffId) === s.myStaffId;
        const manager = await canManageStaff(req, Number(row.staffId));
        if (!(manager && !own) && !isHR(req) && !(own && !row.verified))
            return (0, recordRouter_1.fail)(res, 403, own ? 'This record is verified — ask HR to change it' : 'You cannot change this record');
        const data = cleanTraining({ ...row.get({ plain: true }), ...req.body });
        if (String(data.expiresOn || '') !== String(row.expiresOn || ''))
            data.remindedFor = null;
        await row.update(data);
        await (0, helpers_1.audit)(req, 'Training', 'Update', 'TrainingRecord', row.id, `${(0, helpers_1.userName)(req)} updated training “${row.title}”`);
        (0, helpers_1.emitChange)(req, 'training_record', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Training record saved');
    }));
    r.post('/training-records/:id(\\d+)/verify', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR can verify training records');
        const row = await models_1.ErpModels.TrainingRecord.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Record not found');
        await row.update({ verified: true, verifiedByName: (0, helpers_1.userName)(req) });
        await (0, helpers_1.audit)(req, 'Training', 'Verify', 'TrainingRecord', row.id, `${(0, helpers_1.userName)(req)} verified “${row.title}”`);
        (0, helpers_1.emitChange)(req, 'training_record', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Verified');
    }));
    r.delete('/training-records/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.TrainingRecord.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Record not found');
        const s = await trainingScope(req);
        const own = Number(row.staffId) === s.myStaffId && !row.verified;
        if (!isHR(req) && !own)
            return (0, recordRouter_1.fail)(res, 403, 'Only HR can delete this record');
        await row.destroy();
        await (0, helpers_1.audit)(req, 'Training', 'Delete', 'TrainingRecord', row.id, `${(0, helpers_1.userName)(req)} deleted training “${row.title}”`);
        (0, helpers_1.emitChange)(req, 'training_record', 'deleted', { id: row.id });
        return (0, recordRouter_1.ok)(res, { id: row.id }, 'Record deleted');
    }));
    return r;
}
//# sourceMappingURL=compliance.js.map