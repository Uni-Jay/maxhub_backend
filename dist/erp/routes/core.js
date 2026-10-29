"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreRouter = coreRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const recordRouter_1 = require("../recordRouter");
const helpers_1 = require("../helpers");
const outbound_1 = require("../outbound");
const channels_1 = require("../channels");
const ENTITY_MODEL = {
    travel_case: 'TravelCase', travel_booking: 'TravelBooking', tech_project: 'TechProject', service_subscription: 'ServiceSubscription',
    support_ticket: 'SupportTicket', custom_order: 'CustomOrder', export_order: 'ExportOrder',
};
async function canEditBrandContent(req, departmentId) {
    if ((0, helpers_1.isManagement)(req))
        return true;
    if ((0, helpers_1.roleOf)(req) === 'hod' || (0, helpers_1.roleOf)(req) === 'hr') {
        if (!departmentId)
            return (0, helpers_1.roleOf)(req) === 'hr';
        return (await (0, helpers_1.headedDepartmentIds)((0, helpers_1.userId)(req))).includes(Number(departmentId)) || (0, helpers_1.roleOf)(req) === 'hr';
    }
    return false;
}
function coreRouter() {
    const r = (0, express_1.Router)();
    r.get('/push/key', (0, recordRouter_1.wrap)(async (_req, res) => (0, recordRouter_1.ok)(res, { publicKey: await require('../push').initPush() })));
    r.post('/push/subscribe', (0, recordRouter_1.wrap)(async (req, res) => {
        await require('../push').saveSubscription((0, helpers_1.userId)(req), req.body?.subscription, req.get('user-agent'));
        return (0, recordRouter_1.ok)(res, null, 'Notifications enabled');
    }));
    r.post('/push/unsubscribe', (0, recordRouter_1.wrap)(async (req, res) => {
        if (req.body?.endpoint)
            await require('../push').removeSubscription(String(req.body.endpoint));
        return (0, recordRouter_1.ok)(res, null, 'Removed');
    }));
    r.post('/push/test', (0, recordRouter_1.wrap)(async (req, res) => {
        await require('../push').pushToUsers([(0, helpers_1.userId)(req)], { title: 'MaxHub notifications are on', body: 'You will see alerts here even when MaxHub is in the background.', url: '/notifications', tag: 'push-test' });
        return (0, recordRouter_1.ok)(res, null, 'Test sent');
    }));
    r.get('/brands', (0, recordRouter_1.wrap)(async (_req, res) => {
        const profiles = await models_1.ErpModels.BrandProfile.findAll({ order: [['id', 'ASC']], raw: true });
        const depts = await helpers_1.db.query(`SELECT d.id, d.code, d.name, d.description, d."parentDepartmentId", d."headUserId", d.status,
              TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')) AS "headName",
              (SELECT COUNT(DISTINCT s.id) FROM staff s LEFT JOIN staff_departments sd ON sd."staffId" = s.id
                WHERE s."deletedAt" IS NULL AND (s."departmentId" = d.id OR sd."departmentId" = d.id)) AS "staffCount"
       FROM departments d LEFT JOIN users u ON u.id = d."headUserId"
       WHERE d."deletedAt" IS NULL ORDER BY d.id`, { type: sequelize_1.QueryTypes.SELECT });
        const brands = profiles.map((p) => ({
            ...p,
            department: depts.find((d) => Number(d.id) === Number(p.departmentId)) || null,
            divisions: depts.filter((d) => Number(d.parentDepartmentId) === Number(p.departmentId)),
        }));
        const hq = await helpers_1.db.query(`SELECT b.* FROM branches b WHERE b.id = (SELECT (value::text)::bigint FROM erp_settings WHERE key = 'headOfficeBranchId')`, { type: sequelize_1.QueryTypes.SELECT });
        return (0, recordRouter_1.ok)(res, { brands, departments: depts, headOffice: hq[0] || null });
    }));
    r.put('/brands/:code', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only Super Admin or Admin can edit brand settings');
        const row = await models_1.ErpModels.BrandProfile.findOne({ where: { code: req.params.code.toUpperCase() } });
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Brand not found');
        const data = (0, recordRouter_1.clean)(req.body, models_1.ErpModels.BrandProfile, ['departmentId']);
        await row.update(data);
        await (0, helpers_1.audit)(req, 'erp', 'update', 'brand_profile', row.id, `Brand ${row.code} settings updated`, data);
        (0, helpers_1.emitChange)(req, 'brand', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Brand updated');
    }));
    r.get('/people', (0, recordRouter_1.wrap)(async (_req, res) => {
        const rows = await helpers_1.db.query(`SELECT u.id, TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')) AS name, u.email, s.position, s."departmentId"
       FROM users u LEFT JOIN staff s ON s."userId" = u.id AND s."deletedAt" IS NULL
       WHERE u."deletedAt" IS NULL
         AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles ro ON ro.id = ur."roleId" WHERE ur."userId" = u.id AND ur."deletedAt" IS NULL AND LOWER(ro.code) = 'student')
       ORDER BY name`, { type: sequelize_1.QueryTypes.SELECT });
        return (0, recordRouter_1.ok)(res, rows.map((p) => ({ ...p, id: Number(p.id), name: p.name || p.email })));
    }));
    r.get('/payments', (0, recordRouter_1.wrap)(async (req, res) => {
        const where = {};
        const and = [];
        const scope = await (0, recordRouter_1.scopeWhere)(req);
        if (scope)
            and.push(scope);
        const dept = await (0, helpers_1.resolveDepartmentId)(req.query.brand ?? req.query.departmentId);
        if (dept)
            where.departmentId = { [sequelize_1.Op.in]: await (0, helpers_1.departmentFamily)(dept) };
        if (req.query.relatedType)
            where.relatedType = req.query.relatedType;
        if (req.query.relatedId)
            where.relatedId = req.query.relatedId;
        if (req.query.status)
            where.status = req.query.status;
        if (req.query.from || req.query.to)
            where.paidAt = { ...(req.query.from ? { [sequelize_1.Op.gte]: new Date(String(req.query.from)) } : {}), ...(req.query.to ? { [sequelize_1.Op.lte]: new Date(`${req.query.to}T23:59:59`) } : {}) };
        const qtext = String(req.query.q || '').trim();
        if (qtext)
            and.push({ [sequelize_1.Op.or]: ['receiptNo', 'customerName', 'relatedCode', 'reference', 'description'].map((f) => ({ [f]: { [sequelize_1.Op.iLike]: `%${qtext}%` } })) });
        if (and.length)
            where[sequelize_1.Op.and] = and;
        const limit = Math.min((0, helpers_1.toNum)(req.query.limit, 50), 500);
        const page = Math.max((0, helpers_1.toNum)(req.query.page, 1), 1);
        const { rows, count } = await models_1.ErpModels.Payment.findAndCountAll({ where, order: [['paidAt', 'DESC']], limit, offset: (page - 1) * limit });
        const totals = await models_1.ErpModels.Payment.findAll({ where: { ...where, status: 'Completed' }, attributes: ['currency', [helpers_1.db.fn('SUM', helpers_1.db.col('amount')), 'total']], group: ['currency'], raw: true });
        return (0, recordRouter_1.ok)(res, { items: rows, total: count, page, limit, totals });
    }));
    r.post('/payments', (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        if (!((0, helpers_1.toNum)(b.amount) > 0))
            return (0, recordRouter_1.fail)(res, 400, 'Amount must be greater than zero');
        let related = null;
        if (b.relatedType && ENTITY_MODEL[b.relatedType] && b.relatedId)
            related = await models_1.ErpModels[ENTITY_MODEL[b.relatedType]].findByPk(b.relatedId);
        const departmentId = (await (0, helpers_1.resolveDepartmentId)(b.brand ?? b.departmentId)) ?? related?.departmentId ?? null;
        const data = (0, recordRouter_1.clean)(b, models_1.ErpModels.Payment, ['receiptNo', 'status', 'voidReason']);
        Object.assign(data, {
            departmentId,
            customerName: b.customerName || related?.customerName,
            customerEmail: b.customerEmail || related?.customerEmail,
            customerPhone: b.customerPhone || related?.customerPhone,
            clientId: b.clientId || related?.clientId || null,
            relatedCode: related?.code || b.relatedCode || null,
            currency: b.currency || related?.currency || 'NGN',
            description: b.description || (related ? `Payment for ${related.code}` : 'Payment'),
            createdById: (0, helpers_1.userId)(req), receivedByName: (0, helpers_1.userName)(req),
        });
        if (!data.customerName)
            return (0, recordRouter_1.fail)(res, 400, 'Customer name is required');
        data.receiptNo = await (0, helpers_1.nextCode)(`${await (0, recordRouter_1.brandPrefix)(departmentId)}-RCT`);
        const row = await models_1.ErpModels.Payment.create(data);
        if (related)
            await (0, recordRouter_1.logActivity)(req, b.relatedType, related.id, related.departmentId, 'Payment', `Payment ${row.receiptNo}: ${row.currency} ${Number(row.amount).toLocaleString()} (${row.method})`, { paymentId: row.id });
        await (0, helpers_1.audit)(req, 'erp', 'create', 'payment', row.id, `Receipt ${row.receiptNo} issued`, data);
        (0, helpers_1.emitChange)(req, 'payment', 'created', row);
        if (related)
            (0, helpers_1.emitChange)(req, b.relatedType, 'updated', related);
        return (0, recordRouter_1.ok)(res, row, 'Payment recorded', 201);
    }));
    r.patch('/payments/:id(\\d+)/void', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only Super Admin or Admin can void a receipt');
        const row = await models_1.ErpModels.Payment.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Payment not found');
        if (Number(row.createdById) === (0, helpers_1.userId)(req) && !(0, helpers_1.isSuper)(req))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot void a receipt you issued yourself — ask another admin');
        const reason = String(req.body.reason || '').trim();
        if (!reason)
            return (0, recordRouter_1.fail)(res, 400, 'A reason is required');
        await row.update({ status: 'Voided', voidReason: `${reason} (by ${(0, helpers_1.userName)(req)})` });
        await (0, helpers_1.audit)(req, 'erp', 'void', 'payment', row.id, `Receipt ${row.receiptNo} voided: ${reason}`);
        (0, helpers_1.emitChange)(req, 'payment', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Receipt voided');
    }));
    r.get('/payments/:id(\\d+)/receipt', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.Payment.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Payment not found');
        const brand = await (0, outbound_1.brandForDepartment)(row.departmentId);
        let balance = null;
        if (row.relatedType && ENTITY_MODEL[row.relatedType] && row.relatedId) {
            const rel = await models_1.ErpModels[ENTITY_MODEL[row.relatedType]].findByPk(row.relatedId);
            const due = (0, helpers_1.toNum)(rel?.amountQuoted ?? rel?.total ?? rel?.totalPrice ?? rel?.contractValue ?? rel?.sellingPrice, 0);
            const paid = await helpers_1.db.query(`SELECT COALESCE(SUM(amount),0) AS s FROM erp_payments WHERE "relatedType" = :t AND "relatedId" = :id AND status = 'Completed' AND "paidAt" <= :at`, { replacements: { t: row.relatedType, id: row.relatedId, at: row.paidAt }, type: sequelize_1.QueryTypes.SELECT });
            if (due > 0)
                balance = { totalDue: due, paidToDate: Number(paid[0].s), outstanding: Math.max(due - Number(paid[0].s), 0) };
        }
        return (0, recordRouter_1.ok)(res, { payment: row, brand, balance });
    }));
    r.get('/documents/templates', (0, recordRouter_1.wrap)(async (req, res) => {
        const where = {};
        const dept = await (0, helpers_1.resolveDepartmentId)(req.query.brand ?? req.query.departmentId);
        if (dept)
            where.departmentId = { [sequelize_1.Op.in]: await (0, helpers_1.departmentFamily)(dept) };
        if (req.query.category)
            where.category = req.query.category;
        if (req.query.active !== 'all')
            where.isActive = true;
        const rows = await models_1.ErpModels.DocumentTemplate.findAll({ where, order: [['departmentId', 'ASC'], ['title', 'ASC']] });
        return (0, recordRouter_1.ok)(res, rows);
    }));
    r.post('/documents/templates', (0, recordRouter_1.wrap)(async (req, res) => {
        const departmentId = await (0, helpers_1.resolveDepartmentId)(req.body.brand ?? req.body.departmentId);
        if (!(await canEditBrandContent(req, departmentId)))
            return (0, recordRouter_1.fail)(res, 403, 'Only Admin, HR or the Head of this department can add documents');
        if (!req.body.title)
            return (0, recordRouter_1.fail)(res, 400, 'Title is required');
        if (!req.body.body && !req.body.fileUrl)
            return (0, recordRouter_1.fail)(res, 400, 'Add the document text or upload a file');
        const data = (0, recordRouter_1.clean)(req.body, models_1.ErpModels.DocumentTemplate, ['version']);
        Object.assign(data, { departmentId, body: data.body ? (0, outbound_1.sanitizeHtml)(data.body) : null, createdById: (0, helpers_1.userId)(req), updatedById: (0, helpers_1.userId)(req) });
        const row = await models_1.ErpModels.DocumentTemplate.create(data);
        await (0, helpers_1.audit)(req, 'erp', 'create', 'document_template', row.id, `Document template "${row.title}" created`);
        (0, helpers_1.emitChange)(req, 'document_template', 'created', row);
        return (0, recordRouter_1.ok)(res, row, 'Document saved', 201);
    }));
    r.put('/documents/templates/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.DocumentTemplate.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Document not found');
        if (!(await canEditBrandContent(req, row.departmentId)))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot edit this document');
        const data = (0, recordRouter_1.clean)(req.body, models_1.ErpModels.DocumentTemplate, ['version', 'departmentId']);
        if (data.body !== undefined && data.body)
            data.body = (0, outbound_1.sanitizeHtml)(data.body);
        const contentChanged = (data.body !== undefined && data.body !== row.body) || (data.fileUrl !== undefined && data.fileUrl !== row.fileUrl);
        await row.update({ ...data, updatedById: (0, helpers_1.userId)(req), ...(contentChanged ? { version: row.version + 1 } : {}) });
        await (0, helpers_1.audit)(req, 'erp', 'update', 'document_template', row.id, `Document "${row.title}" updated to v${row.version}`);
        (0, helpers_1.emitChange)(req, 'document_template', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Document updated');
    }));
    r.delete('/documents/templates/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.DocumentTemplate.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Document not found');
        if (!(await canEditBrandContent(req, row.departmentId)))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot delete this document');
        await row.update({ isActive: false });
        (0, helpers_1.emitChange)(req, 'document_template', 'deleted', row);
        return (0, recordRouter_1.ok)(res, null, 'Document archived');
    }));
    r.get('/documents/requests', (0, recordRouter_1.wrap)(async (req, res) => {
        const where = {};
        const dept = await (0, helpers_1.resolveDepartmentId)(req.query.brand ?? req.query.departmentId);
        if (dept)
            where.departmentId = { [sequelize_1.Op.in]: await (0, helpers_1.departmentFamily)(dept) };
        if (req.query.status)
            where.status = req.query.status;
        if (req.query.relatedType)
            where.relatedType = req.query.relatedType;
        if (req.query.relatedId)
            where.relatedId = req.query.relatedId;
        const q = String(req.query.q || '').trim();
        if (q)
            where[sequelize_1.Op.or] = ['code', 'title', 'recipientName', 'recipientEmail'].map((f) => ({ [f]: { [sequelize_1.Op.iLike]: `%${q}%` } }));
        if (!(0, helpers_1.isManagement)(req) && (0, helpers_1.roleOf)(req) !== 'hr') {
            const heads = (0, helpers_1.roleOf)(req) === 'hod' ? await (0, helpers_1.headedDepartmentIds)((0, helpers_1.userId)(req)) : [];
            where[sequelize_1.Op.and] = [{ [sequelize_1.Op.or]: [{ sentById: (0, helpers_1.userId)(req) }, ...(heads.length ? [{ departmentId: { [sequelize_1.Op.in]: heads } }] : [])] }];
        }
        const rows = await models_1.ErpModels.SignatureRequest.findAll({ where, order: [['createdAt', 'DESC']], limit: Math.min((0, helpers_1.toNum)(req.query.limit, 100), 500), attributes: { exclude: ['signatureImage', 'renderedBody', 'token'] } });
        return (0, recordRouter_1.ok)(res, rows);
    }));
    r.get('/documents/requests/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.SignatureRequest.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Not found');
        const brand = await (0, outbound_1.brandForDepartment)(row.departmentId);
        const json = row.toJSON();
        return (0, recordRouter_1.ok)(res, { ...json, token: undefined, signLink: `${(0, helpers_1.publicAppUrl)()}/sign/${row.token}`, brand });
    }));
    r.post('/documents/requests', (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        const tpl = await models_1.ErpModels.DocumentTemplate.findByPk(b.templateId);
        if (!tpl || !tpl.isActive)
            return (0, recordRouter_1.fail)(res, 404, 'Document template not found');
        let related = null;
        if (b.relatedType && ENTITY_MODEL[b.relatedType] && b.relatedId)
            related = await models_1.ErpModels[ENTITY_MODEL[b.relatedType]].findByPk(b.relatedId);
        const recipientName = String(b.recipientName || related?.customerName || '').trim();
        const recipientEmail = b.recipientEmail || related?.customerEmail || null;
        const recipientPhone = b.recipientPhone || related?.customerWhatsapp || related?.customerPhone || null;
        const channel = String(b.channel || (recipientEmail ? 'Email' : 'WhatsApp'));
        if (!recipientName)
            return (0, recordRouter_1.fail)(res, 400, 'Recipient name is required');
        if ((channel === 'Email' || channel === 'Both') && !recipientEmail)
            return (0, recordRouter_1.fail)(res, 400, 'Recipient email is required');
        if ((channel === 'WhatsApp' || channel === 'Both') && !recipientPhone)
            return (0, recordRouter_1.fail)(res, 400, 'Recipient phone/WhatsApp is required');
        const departmentId = tpl.departmentId || related?.departmentId || null;
        const brand = await (0, outbound_1.brandForDepartment)(departmentId);
        const vars = {
            customerName: recipientName, customerEmail: recipientEmail, customerPhone: recipientPhone,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            brandName: brand.displayName, brandAddress: brand.address, brandEmail: brand.email, brandPhone: brand.phone, brandWebsite: brand.website,
            reference: b.reference || related?.code, service: b.service || related?.serviceType || related?.title || related?.projectType || tpl.title,
            amount: b.amount || (related ? `${related.currency || ''} ${Number(related.amountQuoted ?? related.total ?? related.totalPrice ?? related.contractValue ?? 0).toLocaleString()}` : ''),
            staffName: (0, helpers_1.userName)(req), ...(b.vars || {}),
        };
        const renderedBody = tpl.body ? (0, outbound_1.fillPlaceholders)(tpl.body, vars) : null;
        const token = (0, helpers_1.randomToken)(24);
        const expiresAt = new Date(Date.now() + Math.max((0, helpers_1.toNum)(b.expiresInDays, 30), 1) * 86400000);
        const row = await models_1.ErpModels.SignatureRequest.create({
            code: await (0, helpers_1.nextCode)(`${await (0, recordRouter_1.brandPrefix)(departmentId)}-DOC`), templateId: tpl.id, departmentId, clientId: related?.clientId || b.clientId || null,
            title: tpl.title, category: tpl.category, recipientName, recipientEmail, recipientPhone, channel, token, renderedBody,
            fileUrl: tpl.fileUrl, contentHash: (0, helpers_1.sha256)(`${renderedBody || ''}|${tpl.fileUrl || ''}`), requiresSignature: tpl.requiresSignature,
            status: 'Sent', sentAt: new Date(), expiresAt, relatedType: related ? b.relatedType : b.relatedType || null, relatedId: related?.id || b.relatedId || null, sentById: (0, helpers_1.userId)(req),
        });
        const link = `${(0, helpers_1.publicAppUrl)()}/sign/${token}`;
        const verb = tpl.requiresSignature ? 'review and sign' : 'read';
        const result = { link };
        if (channel === 'Email' || channel === 'Both') {
            result.email = await (0, outbound_1.sendBrandEmail)(brand, recipientEmail, `${tpl.title} — please ${verb}`, (0, outbound_1.brandEmailHtml)(brand, tpl.title, `<p>Dear ${(0, outbound_1.escapeHtml)(recipientName)},</p><p>Please ${verb} the document <strong>${(0, outbound_1.escapeHtml)(tpl.title)}</strong> from ${(0, outbound_1.escapeHtml)(brand.displayName)}.</p><p>The link is personal to you and expires on ${expiresAt.toDateString()}.</p>`, { url: link, label: tpl.requiresSignature ? 'Review & Sign' : 'Read Document' }));
        }
        if (channel === 'WhatsApp' || channel === 'Both') {
            result.whatsapp = await (0, outbound_1.sendWhatsAppText)(recipientPhone, `Hello ${recipientName}, please ${verb} "${tpl.title}" from ${brand.displayName}: ${link}`);
        }
        if (related)
            await (0, recordRouter_1.logActivity)(req, b.relatedType, related.id, related.departmentId, 'Document', `Sent "${tpl.title}" (${row.code}) via ${channel}`, { requestId: row.id });
        await (0, helpers_1.audit)(req, 'erp', 'send', 'signature_request', row.id, `Sent ${tpl.title} to ${recipientName}`);
        (0, helpers_1.emitChange)(req, 'signature_request', 'created', row);
        return (0, recordRouter_1.ok)(res, { id: row.id, code: row.code, ...result }, 'Document sent', 201);
    }));
    r.post('/documents/requests/:id(\\d+)/resend', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.SignatureRequest.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Not found');
        if (['Signed', 'Acknowledged', 'Cancelled'].includes(row.status))
            return (0, recordRouter_1.fail)(res, 400, `This document is already ${row.status.toLowerCase()}`);
        const brand = await (0, outbound_1.brandForDepartment)(row.departmentId);
        const link = `${(0, helpers_1.publicAppUrl)()}/sign/${row.token}`;
        if (row.expiresAt && new Date(row.expiresAt) < new Date())
            await row.update({ expiresAt: new Date(Date.now() + 14 * 86400000), status: 'Sent' });
        const result = { link };
        if (row.recipientEmail && row.channel !== 'WhatsApp')
            result.email = await (0, outbound_1.sendBrandEmail)(brand, row.recipientEmail, `Reminder: ${row.title}`, (0, outbound_1.brandEmailHtml)(brand, row.title, `<p>Dear ${(0, outbound_1.escapeHtml)(row.recipientName)},</p><p>This is a reminder to review the document <strong>${(0, outbound_1.escapeHtml)(row.title)}</strong>.</p>`, { url: link, label: 'Open Document' }));
        if (row.recipientPhone && row.channel !== 'Email')
            result.whatsapp = await (0, outbound_1.sendWhatsAppText)(row.recipientPhone, `Reminder from ${brand.displayName}: please review "${row.title}": ${link}`);
        await row.update({ lastReminderAt: new Date() });
        return (0, recordRouter_1.ok)(res, result, 'Reminder sent');
    }));
    r.patch('/documents/requests/:id(\\d+)/cancel', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.SignatureRequest.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Not found');
        if (row.status === 'Signed')
            return (0, recordRouter_1.fail)(res, 400, 'A signed document cannot be cancelled');
        await row.update({ status: 'Cancelled' });
        (0, helpers_1.emitChange)(req, 'signature_request', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Cancelled');
    }));
    r.post('/channels/sync', (0, recordRouter_1.wrap)(async (req, res) => {
        await (0, channels_1.syncAllChannels)();
        const io = req.app.get('io');
        if (io)
            io.emit('chat:channels_synced', {});
        return (0, recordRouter_1.ok)(res, null, 'Channels synced');
    }));
    r.get('/reports/weekly-summary', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req) && (0, helpers_1.roleOf)(req) !== 'hod' && (0, helpers_1.roleOf)(req) !== 'hr')
            return (0, recordRouter_1.fail)(res, 403, 'Not allowed');
        const { buildWeeklySummary } = require('../scheduler');
        return (0, recordRouter_1.ok)(res, await buildWeeklySummary(req.query.weekStart ? new Date(String(req.query.weekStart)) : undefined));
    }));
    r.post('/notify', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req) && (0, helpers_1.roleOf)(req) !== 'hod')
            return (0, recordRouter_1.fail)(res, 403, 'Not allowed');
        const ids = (req.body.userIds || []).map(Number).filter(Boolean);
        await (0, helpers_1.notifyUsers)(req, ids, { title: String(req.body.title || 'Notice'), message: String(req.body.message || ''), actionUrl: req.body.actionUrl });
        return (0, recordRouter_1.ok)(res, null, 'Sent');
    }));
    return r;
}
//# sourceMappingURL=core.js.map