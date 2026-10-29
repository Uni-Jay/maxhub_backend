import { Router } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { ErpModels } from '../models';
import { wrap, ok, fail, scopeWhere, logActivity, brandPrefix, clean } from '../recordRouter';
import {
  audit, db, departmentFamily, emitChange, isManagement, isSuper, nextCode, notifyUsers, publicAppUrl,
  randomToken, resolveDepartmentId, roleOf, sha256, toNum, userId, userName, headedDepartmentIds,
} from '../helpers';
import { brandEmailHtml, brandForDepartment, escapeHtml, fillPlaceholders, sanitizeHtml, sendBrandEmail, sendWhatsAppText } from '../outbound';
import { syncAllChannels } from '../channels';

const ENTITY_MODEL: Record<string, string> = {
  travel_case: 'TravelCase', travel_booking: 'TravelBooking', tech_project: 'TechProject', service_subscription: 'ServiceSubscription',
  support_ticket: 'SupportTicket', custom_order: 'CustomOrder', export_order: 'ExportOrder',
};

async function canEditBrandContent(req: any, departmentId: number | null): Promise<boolean> {
  if (isManagement(req)) return true;
  if (roleOf(req) === 'hod' || roleOf(req) === 'hr') {
    if (!departmentId) return roleOf(req) === 'hr';
    return (await headedDepartmentIds(userId(req))).includes(Number(departmentId)) || roleOf(req) === 'hr';
  }
  return false;
}

export function coreRouter(): Router {
  const r = Router();

  // ── Desktop / phone pop-up notifications (Web Push) ──────────────────────
  r.get('/push/key', wrap(async (_req, res) => ok(res, { publicKey: await require('../push').initPush() })));
  r.post('/push/subscribe', wrap(async (req, res) => {
    await require('../push').saveSubscription(userId(req), req.body?.subscription, req.get('user-agent'));
    return ok(res, null, 'Notifications enabled');
  }));
  r.post('/push/unsubscribe', wrap(async (req, res) => {
    if (req.body?.endpoint) await require('../push').removeSubscription(String(req.body.endpoint));
    return ok(res, null, 'Removed');
  }));
  r.post('/push/test', wrap(async (req, res) => {
    await require('../push').pushToUsers([userId(req)], { title: 'MaxHub notifications are on', body: 'You will see alerts here even when MaxHub is in the background.', url: '/notifications', tag: 'push-test' });
    return ok(res, null, 'Test sent');
  }));

  // ── Brands & structure ────────────────────────────────────────────────────
  r.get('/brands', wrap(async (_req, res) => {
    const profiles: any[] = await (ErpModels.BrandProfile as any).findAll({ order: [['id', 'ASC']], raw: true });
    const depts: any[] = await db.query(
      `SELECT d.id, d.code, d.name, d.description, d."parentDepartmentId", d."headUserId", d.status,
              TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')) AS "headName",
              (SELECT COUNT(DISTINCT s.id) FROM staff s LEFT JOIN staff_departments sd ON sd."staffId" = s.id
                WHERE s."deletedAt" IS NULL AND (s."departmentId" = d.id OR sd."departmentId" = d.id)) AS "staffCount"
       FROM departments d LEFT JOIN users u ON u.id = d."headUserId"
       WHERE d."deletedAt" IS NULL ORDER BY d.id`, { type: QueryTypes.SELECT },
    );
    const brands = profiles.map((p) => ({
      ...p,
      department: depts.find((d) => Number(d.id) === Number(p.departmentId)) || null,
      divisions: depts.filter((d) => Number(d.parentDepartmentId) === Number(p.departmentId)),
    }));
    const hq: any[] = await db.query(`SELECT b.* FROM branches b WHERE b.id = (SELECT (value::text)::bigint FROM erp_settings WHERE key = 'headOfficeBranchId')`, { type: QueryTypes.SELECT });
    return ok(res, { brands, departments: depts, headOffice: hq[0] || null });
  }));

  r.put('/brands/:code', wrap(async (req, res) => {
    if (!isManagement(req)) return fail(res, 403, 'Only Super Admin or Admin can edit brand settings');
    const row: any = await (ErpModels.BrandProfile as any).findOne({ where: { code: req.params.code.toUpperCase() } });
    if (!row) return fail(res, 404, 'Brand not found');
    const data = clean(req.body, ErpModels.BrandProfile, ['departmentId']);
    await row.update(data);
    await audit(req, 'erp', 'update', 'brand_profile', row.id, `Brand ${row.code} settings updated`, data);
    emitChange(req, 'brand', 'updated', row);
    return ok(res, row, 'Brand updated');
  }));

  // Staff directory for "assigned to" pickers (active staff users, no students).
  r.get('/people', wrap(async (_req, res) => {
    const rows: any[] = await db.query(
      `SELECT u.id, TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')) AS name, u.email, s.position, s."departmentId"
       FROM users u LEFT JOIN staff s ON s."userId" = u.id AND s."deletedAt" IS NULL
       WHERE u."deletedAt" IS NULL
         AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles ro ON ro.id = ur."roleId" WHERE ur."userId" = u.id AND ur."deletedAt" IS NULL AND LOWER(ro.code) = 'student')
       ORDER BY name`, { type: QueryTypes.SELECT },
    );
    return ok(res, rows.map((p) => ({ ...p, id: Number(p.id), name: p.name || p.email })));
  }));

  // ── Payments & receipts ───────────────────────────────────────────────────
  r.get('/payments', wrap(async (req, res) => {
    const where: any = {}; const and: any[] = [];
    const scope = await scopeWhere(req); if (scope) and.push(scope);
    const dept = await resolveDepartmentId(req.query.brand ?? req.query.departmentId);
    if (dept) where.departmentId = { [Op.in]: await departmentFamily(dept) };
    if (req.query.relatedType) where.relatedType = req.query.relatedType;
    if (req.query.relatedId) where.relatedId = req.query.relatedId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.from || req.query.to) where.paidAt = { ...(req.query.from ? { [Op.gte]: new Date(String(req.query.from)) } : {}), ...(req.query.to ? { [Op.lte]: new Date(`${req.query.to}T23:59:59`) } : {}) };
    const qtext = String(req.query.q || '').trim();
    if (qtext) and.push({ [Op.or]: ['receiptNo', 'customerName', 'relatedCode', 'reference', 'description'].map((f) => ({ [f]: { [Op.iLike]: `%${qtext}%` } })) });
    if (and.length) where[Op.and] = and;
    const limit = Math.min(toNum(req.query.limit, 50), 500); const page = Math.max(toNum(req.query.page, 1), 1);
    const { rows, count } = await (ErpModels.Payment as any).findAndCountAll({ where, order: [['paidAt', 'DESC']], limit, offset: (page - 1) * limit });
    const totals: any[] = await (ErpModels.Payment as any).findAll({ where: { ...where, status: 'Completed' }, attributes: ['currency', [db.fn('SUM', db.col('amount')), 'total']], group: ['currency'], raw: true });
    return ok(res, { items: rows, total: count, page, limit, totals });
  }));

  r.post('/payments', wrap(async (req, res) => {
    const b = req.body || {};
    if (!(toNum(b.amount) > 0)) return fail(res, 400, 'Amount must be greater than zero');
    let related: any = null;
    if (b.relatedType && ENTITY_MODEL[b.relatedType] && b.relatedId) related = await (ErpModels[ENTITY_MODEL[b.relatedType]] as any).findByPk(b.relatedId);
    const departmentId = (await resolveDepartmentId(b.brand ?? b.departmentId)) ?? related?.departmentId ?? null;
    const data: any = clean(b, ErpModels.Payment, ['receiptNo', 'status', 'voidReason']);
    Object.assign(data, {
      departmentId,
      customerName: b.customerName || related?.customerName,
      customerEmail: b.customerEmail || related?.customerEmail,
      customerPhone: b.customerPhone || related?.customerPhone,
      clientId: b.clientId || related?.clientId || null,
      relatedCode: related?.code || b.relatedCode || null,
      currency: b.currency || related?.currency || 'NGN',
      description: b.description || (related ? `Payment for ${related.code}` : 'Payment'),
      createdById: userId(req), receivedByName: userName(req),
    });
    if (!data.customerName) return fail(res, 400, 'Customer name is required');
    data.receiptNo = await nextCode(`${await brandPrefix(departmentId)}-RCT`);
    const row: any = await (ErpModels.Payment as any).create(data);
    if (related) await logActivity(req, b.relatedType, related.id, related.departmentId, 'Payment', `Payment ${row.receiptNo}: ${row.currency} ${Number(row.amount).toLocaleString()} (${row.method})`, { paymentId: row.id });
    await audit(req, 'erp', 'create', 'payment', row.id, `Receipt ${row.receiptNo} issued`, data);
    emitChange(req, 'payment', 'created', row);
    if (related) emitChange(req, b.relatedType, 'updated', related);
    return ok(res, row, 'Payment recorded', 201);
  }));

  r.patch('/payments/:id(\\d+)/void', wrap(async (req, res) => {
    if (!isManagement(req)) return fail(res, 403, 'Only Super Admin or Admin can void a receipt');
    const row: any = await (ErpModels.Payment as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Payment not found');
    if (Number(row.createdById) === userId(req) && !isSuper(req)) return fail(res, 403, 'You cannot void a receipt you issued yourself — ask another admin');
    const reason = String(req.body.reason || '').trim();
    if (!reason) return fail(res, 400, 'A reason is required');
    await row.update({ status: 'Voided', voidReason: `${reason} (by ${userName(req)})` });
    await audit(req, 'erp', 'void', 'payment', row.id, `Receipt ${row.receiptNo} voided: ${reason}`);
    emitChange(req, 'payment', 'updated', row);
    return ok(res, row, 'Receipt voided');
  }));

  // Printable receipt data (brand letterhead + payment)
  r.get('/payments/:id(\\d+)/receipt', wrap(async (req, res) => {
    const row: any = await (ErpModels.Payment as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Payment not found');
    const brand = await brandForDepartment(row.departmentId);
    let balance: any = null;
    if (row.relatedType && ENTITY_MODEL[row.relatedType] && row.relatedId) {
      const rel: any = await (ErpModels[ENTITY_MODEL[row.relatedType]] as any).findByPk(row.relatedId);
      const due = toNum(rel?.amountQuoted ?? rel?.total ?? rel?.totalPrice ?? rel?.contractValue ?? rel?.sellingPrice, 0);
      const paid: any[] = await db.query(`SELECT COALESCE(SUM(amount),0) AS s FROM erp_payments WHERE "relatedType" = :t AND "relatedId" = :id AND status = 'Completed' AND "paidAt" <= :at`, { replacements: { t: row.relatedType, id: row.relatedId, at: row.paidAt }, type: QueryTypes.SELECT });
      if (due > 0) balance = { totalDue: due, paidToDate: Number(paid[0].s), outstanding: Math.max(due - Number(paid[0].s), 0) };
    }
    return ok(res, { payment: row, brand, balance });
  }));

  // ── Documents: terms, policies, agreements ───────────────────────────────
  r.get('/documents/templates', wrap(async (req, res) => {
    const where: any = {};
    const dept = await resolveDepartmentId(req.query.brand ?? req.query.departmentId);
    if (dept) where.departmentId = { [Op.in]: await departmentFamily(dept) };
    if (req.query.category) where.category = req.query.category;
    if (req.query.active !== 'all') where.isActive = true;
    const rows = await (ErpModels.DocumentTemplate as any).findAll({ where, order: [['departmentId', 'ASC'], ['title', 'ASC']] });
    return ok(res, rows);
  }));

  r.post('/documents/templates', wrap(async (req, res) => {
    const departmentId = await resolveDepartmentId(req.body.brand ?? req.body.departmentId);
    if (!(await canEditBrandContent(req, departmentId))) return fail(res, 403, 'Only Admin, HR or the Head of this department can add documents');
    if (!req.body.title) return fail(res, 400, 'Title is required');
    if (!req.body.body && !req.body.fileUrl) return fail(res, 400, 'Add the document text or upload a file');
    const data = clean(req.body, ErpModels.DocumentTemplate, ['version']);
    Object.assign(data, { departmentId, body: data.body ? sanitizeHtml(data.body) : null, createdById: userId(req), updatedById: userId(req) });
    const row = await (ErpModels.DocumentTemplate as any).create(data);
    await audit(req, 'erp', 'create', 'document_template', row.id, `Document template "${row.title}" created`);
    emitChange(req, 'document_template', 'created', row);
    return ok(res, row, 'Document saved', 201);
  }));

  r.put('/documents/templates/:id(\\d+)', wrap(async (req, res) => {
    const row: any = await (ErpModels.DocumentTemplate as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Document not found');
    if (!(await canEditBrandContent(req, row.departmentId))) return fail(res, 403, 'You cannot edit this document');
    const data = clean(req.body, ErpModels.DocumentTemplate, ['version', 'departmentId']);
    if (data.body !== undefined && data.body) data.body = sanitizeHtml(data.body);
    const contentChanged = (data.body !== undefined && data.body !== row.body) || (data.fileUrl !== undefined && data.fileUrl !== row.fileUrl);
    await row.update({ ...data, updatedById: userId(req), ...(contentChanged ? { version: row.version + 1 } : {}) });
    await audit(req, 'erp', 'update', 'document_template', row.id, `Document "${row.title}" updated to v${row.version}`);
    emitChange(req, 'document_template', 'updated', row);
    return ok(res, row, 'Document updated');
  }));

  r.delete('/documents/templates/:id(\\d+)', wrap(async (req, res) => {
    const row: any = await (ErpModels.DocumentTemplate as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Document not found');
    if (!(await canEditBrandContent(req, row.departmentId))) return fail(res, 403, 'You cannot delete this document');
    await row.update({ isActive: false }); // keep history for documents already sent
    emitChange(req, 'document_template', 'deleted', row);
    return ok(res, null, 'Document archived');
  }));

  r.get('/documents/requests', wrap(async (req, res) => {
    const where: any = {};
    const dept = await resolveDepartmentId(req.query.brand ?? req.query.departmentId);
    if (dept) where.departmentId = { [Op.in]: await departmentFamily(dept) };
    if (req.query.status) where.status = req.query.status;
    if (req.query.relatedType) where.relatedType = req.query.relatedType;
    if (req.query.relatedId) where.relatedId = req.query.relatedId;
    const q = String(req.query.q || '').trim();
    if (q) where[Op.or] = ['code', 'title', 'recipientName', 'recipientEmail'].map((f) => ({ [f]: { [Op.iLike]: `%${q}%` } }));
    if (!isManagement(req) && roleOf(req) !== 'hr') {
      const heads = roleOf(req) === 'hod' ? await headedDepartmentIds(userId(req)) : [];
      where[Op.and] = [{ [Op.or]: [{ sentById: userId(req) }, ...(heads.length ? [{ departmentId: { [Op.in]: heads } }] : [])] }];
    }
    const rows = await (ErpModels.SignatureRequest as any).findAll({ where, order: [['createdAt', 'DESC']], limit: Math.min(toNum(req.query.limit, 100), 500), attributes: { exclude: ['signatureImage', 'renderedBody', 'token'] } });
    return ok(res, rows);
  }));

  r.get('/documents/requests/:id(\\d+)', wrap(async (req, res) => {
    const row: any = await (ErpModels.SignatureRequest as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Not found');
    const brand = await brandForDepartment(row.departmentId);
    const json = row.toJSON();
    return ok(res, { ...json, token: undefined, signLink: `${publicAppUrl()}/sign/${row.token}`, brand });
  }));

  // Send a document to a customer (email / WhatsApp / copy link)
  r.post('/documents/requests', wrap(async (req, res) => {
    const b = req.body || {};
    const tpl: any = await (ErpModels.DocumentTemplate as any).findByPk(b.templateId);
    if (!tpl || !tpl.isActive) return fail(res, 404, 'Document template not found');
    let related: any = null;
    if (b.relatedType && ENTITY_MODEL[b.relatedType] && b.relatedId) related = await (ErpModels[ENTITY_MODEL[b.relatedType]] as any).findByPk(b.relatedId);
    const recipientName = String(b.recipientName || related?.customerName || '').trim();
    const recipientEmail = b.recipientEmail || related?.customerEmail || null;
    const recipientPhone = b.recipientPhone || related?.customerWhatsapp || related?.customerPhone || null;
    const channel = String(b.channel || (recipientEmail ? 'Email' : 'WhatsApp'));
    if (!recipientName) return fail(res, 400, 'Recipient name is required');
    if ((channel === 'Email' || channel === 'Both') && !recipientEmail) return fail(res, 400, 'Recipient email is required');
    if ((channel === 'WhatsApp' || channel === 'Both') && !recipientPhone) return fail(res, 400, 'Recipient phone/WhatsApp is required');

    const departmentId = tpl.departmentId || related?.departmentId || null;
    const brand = await brandForDepartment(departmentId);
    const vars = {
      customerName: recipientName, customerEmail: recipientEmail, customerPhone: recipientPhone,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      brandName: brand.displayName, brandAddress: brand.address, brandEmail: brand.email, brandPhone: brand.phone, brandWebsite: brand.website,
      reference: b.reference || related?.code, service: b.service || related?.serviceType || related?.title || related?.projectType || tpl.title,
      amount: b.amount || (related ? `${related.currency || ''} ${Number(related.amountQuoted ?? related.total ?? related.totalPrice ?? related.contractValue ?? 0).toLocaleString()}` : ''),
      staffName: userName(req), ...(b.vars || {}),
    };
    const renderedBody = tpl.body ? fillPlaceholders(tpl.body, vars) : null;
    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + Math.max(toNum(b.expiresInDays, 30), 1) * 86400_000);
    const row: any = await (ErpModels.SignatureRequest as any).create({
      code: await nextCode(`${await brandPrefix(departmentId)}-DOC`), templateId: tpl.id, departmentId, clientId: related?.clientId || b.clientId || null,
      title: tpl.title, category: tpl.category, recipientName, recipientEmail, recipientPhone, channel, token, renderedBody,
      fileUrl: tpl.fileUrl, contentHash: sha256(`${renderedBody || ''}|${tpl.fileUrl || ''}`), requiresSignature: tpl.requiresSignature,
      status: 'Sent', sentAt: new Date(), expiresAt, relatedType: related ? b.relatedType : b.relatedType || null, relatedId: related?.id || b.relatedId || null, sentById: userId(req),
    });
    const link = `${publicAppUrl()}/sign/${token}`;
    const verb = tpl.requiresSignature ? 'review and sign' : 'read';
    const result: any = { link };
    if (channel === 'Email' || channel === 'Both') {
      result.email = await sendBrandEmail(brand, recipientEmail, `${tpl.title} — please ${verb}`,
        brandEmailHtml(brand, tpl.title, `<p>Dear ${escapeHtml(recipientName)},</p><p>Please ${verb} the document <strong>${escapeHtml(tpl.title)}</strong> from ${escapeHtml(brand.displayName)}.</p><p>The link is personal to you and expires on ${expiresAt.toDateString()}.</p>`, { url: link, label: tpl.requiresSignature ? 'Review & Sign' : 'Read Document' }));
    }
    if (channel === 'WhatsApp' || channel === 'Both') {
      result.whatsapp = await sendWhatsAppText(recipientPhone, `Hello ${recipientName}, please ${verb} "${tpl.title}" from ${brand.displayName}: ${link}`);
    }
    if (related) await logActivity(req, b.relatedType, related.id, related.departmentId, 'Document', `Sent "${tpl.title}" (${row.code}) via ${channel}`, { requestId: row.id });
    await audit(req, 'erp', 'send', 'signature_request', row.id, `Sent ${tpl.title} to ${recipientName}`);
    emitChange(req, 'signature_request', 'created', row);
    return ok(res, { id: row.id, code: row.code, ...result }, 'Document sent', 201);
  }));

  r.post('/documents/requests/:id(\\d+)/resend', wrap(async (req, res) => {
    const row: any = await (ErpModels.SignatureRequest as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Not found');
    if (['Signed', 'Acknowledged', 'Cancelled'].includes(row.status)) return fail(res, 400, `This document is already ${row.status.toLowerCase()}`);
    const brand = await brandForDepartment(row.departmentId);
    const link = `${publicAppUrl()}/sign/${row.token}`;
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) await row.update({ expiresAt: new Date(Date.now() + 14 * 86400_000), status: 'Sent' });
    const result: any = { link };
    if (row.recipientEmail && row.channel !== 'WhatsApp') result.email = await sendBrandEmail(brand, row.recipientEmail, `Reminder: ${row.title}`, brandEmailHtml(brand, row.title, `<p>Dear ${escapeHtml(row.recipientName)},</p><p>This is a reminder to review the document <strong>${escapeHtml(row.title)}</strong>.</p>`, { url: link, label: 'Open Document' }));
    if (row.recipientPhone && row.channel !== 'Email') result.whatsapp = await sendWhatsAppText(row.recipientPhone, `Reminder from ${brand.displayName}: please review "${row.title}": ${link}`);
    await row.update({ lastReminderAt: new Date() });
    return ok(res, result, 'Reminder sent');
  }));

  r.patch('/documents/requests/:id(\\d+)/cancel', wrap(async (req, res) => {
    const row: any = await (ErpModels.SignatureRequest as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Not found');
    if (row.status === 'Signed') return fail(res, 400, 'A signed document cannot be cancelled');
    await row.update({ status: 'Cancelled' });
    emitChange(req, 'signature_request', 'updated', row);
    return ok(res, row, 'Cancelled');
  }));

  // ── Chat channels ─────────────────────────────────────────────────────────
  r.post('/channels/sync', wrap(async (req, res) => {
    await syncAllChannels();
    const io = req.app.get('io');
    if (io) io.emit('chat:channels_synced', {});
    return ok(res, null, 'Channels synced');
  }));

  // ── Weekly business summary (Monday report) ───────────────────────────────
  r.get('/reports/weekly-summary', wrap(async (req, res) => {
    if (!isManagement(req) && roleOf(req) !== 'hod' && roleOf(req) !== 'hr') return fail(res, 403, 'Not allowed');
    const { buildWeeklySummary } = require('../scheduler');
    return ok(res, await buildWeeklySummary(req.query.weekStart ? new Date(String(req.query.weekStart)) : undefined));
  }));

  // Notify helper for the frontend (e.g. remind a colleague) — management only
  r.post('/notify', wrap(async (req, res) => {
    if (!isManagement(req) && roleOf(req) !== 'hod') return fail(res, 403, 'Not allowed');
    const ids = (req.body.userIds || []).map(Number).filter(Boolean);
    await notifyUsers(req, ids, { title: String(req.body.title || 'Notice'), message: String(req.body.message || ''), actionUrl: req.body.actionUrl });
    return ok(res, null, 'Sent');
  }));

  return r;
}
