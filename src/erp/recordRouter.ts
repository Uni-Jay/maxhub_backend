import { Router, Request, Response, NextFunction } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { ErpModels } from './models';
import {
  audit, emitChange, headedDepartmentIds, isManagement, memberDepartmentIds, nextCode, notifyUsers,
  resolveDepartmentId, departmentFamily, roleOf, userId, userName, toNum, departmentHeadUserIds,
} from './helpers';
import { brandForDepartment, brandEmailHtml, sendBrandEmail, sendWhatsAppText, escapeHtml } from './outbound';

export interface RecordConfig {
  model: string;             // key in ErpModels
  entity: string;            // e.g. 'travel_case'
  label: string;             // e.g. 'Travel case'
  codeSuffix: string;        // e.g. 'CASE' → VMX-CASE-2026-0001
  searchFields: string[];
  filterFields?: string[];   // exact-match query filters
  stageField?: string;       // 'stage' | 'status'
  stages?: string[];
  defaultBrand?: string;     // department code used when none given
  actionUrl?: (row: any) => string;
  beforeSave?: (data: any, existing: any | null, req: Request) => Promise<void> | void;
  afterStage?: (row: any, from: string, to: string, req: Request) => Promise<void> | void;
  readOnlyFields?: string[];
}

export const wrap = (fn: (req: Request, res: Response) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

export function ok(res: Response, data: any, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data, timestamp: new Date().toISOString() });
}
export function fail(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message, error: { message }, timestamp: new Date().toISOString() });
}

/**
 * Visibility for brand records:
 *  - Super Admin / Admin: everything.
 *  - HOD: departments they head or belong to (+ sub-departments), plus their own.
 *  - Staff: departments they belong to, plus records assigned to / created by them.
 *    Staff not linked to any department yet belong to every brand (current setup).
 */
export async function scopeWhere(req: Request): Promise<WhereOptions | null> {
  if (isManagement(req)) return null;
  const uid = userId(req);
  const depts = new Set<number>(await memberDepartmentIds(uid));
  if (roleOf(req) === 'hod') (await headedDepartmentIds(uid)).forEach((d) => depts.add(d));
  if (!depts.size) return null;
  return {
    [Op.or]: [
      { departmentId: { [Op.in]: [...depts] } },
      { departmentId: null },
      { assignedToUserId: uid },
      { createdById: uid },
    ],
  } as any;
}

export async function canManageRecord(req: Request, row: any): Promise<boolean> {
  if (isManagement(req)) return true;
  const uid = userId(req);
  if (Number(row.createdById) === uid || Number(row.assignedToUserId) === uid) return true;
  const scope = await scopeWhere(req);
  if (!scope) return true;
  if (roleOf(req) === 'hod') return !row.departmentId || (await headedDepartmentIds(uid)).includes(Number(row.departmentId)) || (await memberDepartmentIds(uid)).includes(Number(row.departmentId));
  return !row.departmentId || (await memberDepartmentIds(uid)).includes(Number(row.departmentId));
}

async function canDelete(req: Request, row: any): Promise<boolean> {
  if (isManagement(req)) return true;
  if (roleOf(req) === 'hod') return !row.departmentId || (await headedDepartmentIds(userId(req))).includes(Number(row.departmentId));
  return false;
}

const PROTECTED = ['id', 'code', 'createdById', 'createdAt', 'updatedAt'];

export function clean(body: any, model: any, extraBlocked: string[] = []): any {
  const defs = model.getAttributes();
  const attrs = Object.keys(defs);
  const out: any = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!attrs.includes(k) || PROTECTED.includes(k) || extraBlocked.includes(k)) continue;
    const blank = v === '' || v === null;
    // A field left empty that cannot be empty (e.g. a fee) falls back to its default (0) instead of failing.
    if (blank && defs[k].allowNull === false) { if (defs[k].defaultValue !== undefined) out[k] = defs[k].defaultValue; continue; }
    out[k] = blank ? null : v;
  }
  return out;
}

export async function logActivity(req: Request, entityType: string, entityId: any, departmentId: any, kind: string, content: string, meta?: any, channel?: string) {
  return (ErpModels.Activity as any).create({
    entityType, entityId, departmentId: departmentId || null, kind, content, meta, channel,
    createdById: userId(req) || null, createdByName: req ? userName(req) : 'System',
  });
}

export async function brandPrefix(departmentId: any): Promise<string> {
  const b = await brandForDepartment(departmentId ? Number(departmentId) : null);
  return (b as any).receiptPrefix || 'MXH';
}

/** Client file number in the same style as case numbers, e.g. VMX-CLT-2026-0014. */
export async function nextClientCode(departmentId: any): Promise<string> {
  return nextCode(`${await brandPrefix(departmentId)}-CLT`);
}

export function buildRecordRouter(cfg: RecordConfig): Router {
  const router = Router();
  const M: any = () => ErpModels[cfg.model];
  const stageField = cfg.stageField || 'stage';

  // List
  router.get('/', wrap(async (req, res) => {
    const where: any = {};
    const and: any[] = [];
    const scope = await scopeWhere(req);
    if (scope) and.push(scope);
    const dept = await resolveDepartmentId(req.query.brand ?? req.query.departmentId);
    if (dept) where.departmentId = { [Op.in]: await departmentFamily(dept) };
    for (const f of cfg.filterFields || []) if (req.query[f] !== undefined && req.query[f] !== '') where[f] = req.query[f];
    if (req.query.assignedToMe === 'true') where.assignedToUserId = userId(req);
    const qtext = String(req.query.q || req.query.search || '').trim();
    if (qtext) and.push({ [Op.or]: ['code', ...cfg.searchFields].map((f) => ({ [f]: { [Op.iLike]: `%${qtext}%` } })) });
    if (and.length) where[Op.and] = and;
    const limit = Math.min(toNum(req.query.limit, 50), 500);
    const page = Math.max(toNum(req.query.page, 1), 1);
    const sortField = Object.keys(M().getAttributes()).includes(String(req.query.sortBy)) ? String(req.query.sortBy) : 'createdAt';
    const sortDir = String(req.query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const { rows, count } = await M().findAndCountAll({ where, limit, offset: (page - 1) * limit, order: [[sortField, sortDir]] });
    // Stage counts for pipeline headers (same scope, no stage filter).
    let stageCounts: Record<string, number> = {};
    if (cfg.stages) {
      const cw = { ...where }; delete cw[stageField];
      const grouped: any[] = await M().findAll({ where: cw, attributes: [stageField, [M().sequelize.fn('COUNT', '*'), 'n']], group: [stageField], raw: true });
      stageCounts = Object.fromEntries(grouped.map((g) => [g[stageField], Number(g.n)]));
    }
    return ok(res, { items: rows, total: count, page, limit, stages: cfg.stages || [], stageCounts });
  }));

  router.get('/meta', wrap(async (_req, res) => ok(res, { stages: cfg.stages || [], label: cfg.label })));

  // Read
  router.get('/:id(\\d+)', wrap(async (req, res) => {
    const row = await M().findByPk(req.params.id);
    if (!row) return fail(res, 404, `${cfg.label} not found`);
    if (!(await canManageRecord(req, row)) && (await scopeWhere(req))) {
      const visible = await M().count({ where: { [Op.and]: [{ id: row.id }, (await scopeWhere(req)) as any] } });
      if (!visible) return fail(res, 403, 'You do not have access to this record');
    }
    const activities = await (ErpModels.Activity as any).findAll({ where: { entityType: cfg.entity, entityId: row.id }, order: [['createdAt', 'DESC']], limit: 200 });
    const payments = await (ErpModels.Payment as any).findAll({ where: { relatedType: cfg.entity, relatedId: row.id }, order: [['paidAt', 'DESC']] });
    return ok(res, { ...row.toJSON(), activities, payments, amountPaid: payments.filter((p: any) => p.status === 'Completed').reduce((s: number, p: any) => s + Number(p.amount), 0) });
  }));

  // Create
  router.post('/', wrap(async (req, res) => {
    const data = clean(req.body, M(), cfg.readOnlyFields);
    data.departmentId = (await resolveDepartmentId(req.body.brand ?? req.body.departmentId)) ?? (cfg.defaultBrand ? await resolveDepartmentId(cfg.defaultBrand) : null);
    data.createdById = userId(req);
    if (cfg.beforeSave) await cfg.beforeSave(data, null, req);
    data.code = await nextCode(`${await brandPrefix(data.departmentId)}-${cfg.codeSuffix}`);
    const row = await M().create(data);
    await logActivity(req, cfg.entity, row.id, row.departmentId, 'System', `${cfg.label} ${row.code} created by ${userName(req)}`);
    await audit(req, 'erp', 'create', cfg.entity, row.id, `${cfg.label} ${row.code} created`, data);
    if (row.assignedToUserId && Number(row.assignedToUserId) !== userId(req)) {
      await notifyUsers(req, [Number(row.assignedToUserId)], { title: `New ${cfg.label} assigned`, message: `${row.code} has been assigned to you.`, type: 'Assignment', actionUrl: cfg.actionUrl?.(row), entityType: cfg.entity, entityId: row.id });
    }
    emitChange(req, cfg.entity, 'created', row);
    return ok(res, row, `${cfg.label} created`, 201);
  }));

  // Update
  const updateHandler = wrap(async (req, res) => {
    const row = await M().findByPk(req.params.id);
    if (!row) return fail(res, 404, `${cfg.label} not found`);
    if (!(await canManageRecord(req, row))) return fail(res, 403, 'You cannot edit this record');
    const data = clean(req.body, M(), [...(cfg.readOnlyFields || []), stageField]);
    if (req.body.brand !== undefined || req.body.departmentId !== undefined) data.departmentId = await resolveDepartmentId(req.body.brand ?? req.body.departmentId);
    if (cfg.beforeSave) await cfg.beforeSave(data, row, req);
    const prevAssignee = row.assignedToUserId;
    await row.update(data);
    await audit(req, 'erp', 'update', cfg.entity, row.id, `${cfg.label} ${row.code} updated`, data);
    if (row.assignedToUserId && String(row.assignedToUserId) !== String(prevAssignee) && Number(row.assignedToUserId) !== userId(req)) {
      await notifyUsers(req, [Number(row.assignedToUserId)], { title: `${cfg.label} assigned to you`, message: `${row.code} is now assigned to you.`, type: 'Assignment', actionUrl: cfg.actionUrl?.(row), entityType: cfg.entity, entityId: row.id });
    }
    emitChange(req, cfg.entity, 'updated', row);
    return ok(res, row, `${cfg.label} updated`);
  });
  router.put('/:id(\\d+)', updateHandler);
  router.patch('/:id(\\d+)', updateHandler);

  // Stage / status change with timeline + notifications
  if (cfg.stages) {
    router.patch('/:id(\\d+)/stage', wrap(async (req, res) => {
      const row = await M().findByPk(req.params.id);
      if (!row) return fail(res, 404, `${cfg.label} not found`);
      if (!(await canManageRecord(req, row))) return fail(res, 403, 'You cannot update this record');
      const to = String(req.body.stage || req.body.status || '');
      if (!cfg.stages!.includes(to)) return fail(res, 400, `Stage must be one of: ${cfg.stages!.join(', ')}`);
      const from = row[stageField];
      if (from === to) return ok(res, row, 'No change');
      await row.update({ [stageField]: to });
      const note = req.body.note ? ` — ${String(req.body.note)}` : '';
      await logActivity(req, cfg.entity, row.id, row.departmentId, 'StageChange', `${from} → ${to}${note}`, { from, to });
      await audit(req, 'erp', 'stage', cfg.entity, row.id, `${row.code}: ${from} → ${to}`);
      if (cfg.afterStage) await cfg.afterStage(row, from, to, req);
      const watchers = [Number(row.assignedToUserId), Number(row.createdById), ...(await departmentHeadUserIds(row.departmentId))];
      await notifyUsers(req, watchers, { title: `${row.code} moved to ${to}`, message: `${userName(req)} moved ${cfg.label.toLowerCase()} ${row.code} from ${from} to ${to}.`, actionUrl: cfg.actionUrl?.(row), entityType: cfg.entity, entityId: row.id }, { excludeSelf: userId(req) });
      emitChange(req, cfg.entity, 'stage', row);
      return ok(res, row, `Moved to ${to}`);
    }));
  }

  // Notes / timeline
  router.post('/:id(\\d+)/activities', wrap(async (req, res) => {
    const row = await M().findByPk(req.params.id);
    if (!row) return fail(res, 404, `${cfg.label} not found`);
    const content = String(req.body.content || '').trim();
    if (!content) return fail(res, 400, 'Note cannot be empty');
    const act = await logActivity(req, cfg.entity, row.id, row.departmentId, req.body.kind === 'Call' ? 'Call' : 'Note', content);
    emitChange(req, cfg.entity, 'activity', row);
    return ok(res, act, 'Saved', 201);
  }));

  // Message the customer by email and/or WhatsApp
  router.post('/:id(\\d+)/message', wrap(async (req, res) => {
    const row = await M().findByPk(req.params.id);
    if (!row) return fail(res, 404, `${cfg.label} not found`);
    const channel = String(req.body.channel || 'WhatsApp');
    const text = String(req.body.message || '').trim();
    if (!text) return fail(res, 400, 'Message cannot be empty');
    const brand = await brandForDepartment(row.departmentId);
    const result: any = {};
    if (channel === 'Email' || channel === 'Both') {
      if (!row.customerEmail) return fail(res, 400, 'This customer has no email address');
      const subject = String(req.body.subject || `${brand.displayName} — ${row.code}`);
      result.email = await sendBrandEmail(brand, row.customerEmail, subject, brandEmailHtml(brand, subject, `<p>Dear ${escapeHtml(row.customerName)},</p><p style="white-space:pre-line">${escapeHtml(text)}</p><p>Regards,<br/>${escapeHtml(userName(req))}<br/>${escapeHtml(brand.displayName)}</p>`));
    }
    if (channel === 'WhatsApp' || channel === 'Both') {
      const phone = row.customerWhatsapp || row.customerPhone;
      if (!phone) return fail(res, 400, 'This customer has no phone/WhatsApp number');
      result.whatsapp = await sendWhatsAppText(phone, `${text}\n\n— ${userName(req)}, ${brand.displayName}`);
    }
    await logActivity(req, cfg.entity, row.id, row.departmentId, 'Message', text, { result, subject: req.body.subject }, channel);
    emitChange(req, cfg.entity, 'activity', row);
    return ok(res, result, 'Message processed');
  }));

  // Delete
  router.delete('/:id(\\d+)', wrap(async (req, res) => {
    const row = await M().findByPk(req.params.id);
    if (!row) return fail(res, 404, `${cfg.label} not found`);
    if (!(await canDelete(req, row))) return fail(res, 403, 'Only Admin or the Head of Department can delete this record');
    await row.destroy();
    await audit(req, 'erp', 'delete', cfg.entity, row.id, `${cfg.label} ${row.code} deleted`);
    emitChange(req, cfg.entity, 'deleted', row);
    return ok(res, null, `${cfg.label} deleted`);
  }));

  return router;
}
