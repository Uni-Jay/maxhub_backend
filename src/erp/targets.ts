import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import { ErpModels } from './models';
import { wrap, ok, fail } from './recordRouter';
import { audit, db, emitChange, isManagement, roleOf, toNum, userId, userName } from './helpers';

/**
 * Targets for the whole company or one brand, by month, quarter or year,
 * with live progress from the real figures (money in, profit, customers,
 * orders, students, visas approved, projects delivered) or a number typed
 * in for anything else.
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;
const n = (rows: any[]) => Number(rows[0]?.v || 0);

export const METRICS: Record<string, { label: string; money?: boolean; brands?: string[] }> = {
  revenue: { label: 'Money in', money: true },
  profit: { label: 'Profit', money: true },
  newCustomers: { label: 'New customers' },
  orders: { label: 'Orders', brands: ['BM', 'MF'] },
  students: { label: 'New students', brands: ['KS', 'BM'] },
  visasApproved: { label: 'Visas approved', brands: ['VM'] },
  projectsDelivered: { label: 'Projects delivered', brands: ['KS'] },
  manual: { label: 'Other (update by hand)' },
};

export function periodRange(t: { period: string; year: number; month?: number | null; quarter?: number | null }) {
  const y = Number(t.year);
  if (t.period === 'year') return { start: new Date(Date.UTC(y, 0, 1)), end: new Date(Date.UTC(y + 1, 0, 1)), label: String(y) };
  if (t.period === 'quarter') {
    const qn = Math.min(4, Math.max(1, Number(t.quarter) || 1));
    return { start: new Date(Date.UTC(y, (qn - 1) * 3, 1)), end: new Date(Date.UTC(y, qn * 3, 1)), label: `Q${qn} ${y}` };
  }
  const m = Math.min(12, Math.max(1, Number(t.month) || 1));
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)), label: new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) };
}

async function brandDeptIds(code: string | null): Promise<number[] | null> {
  if (!code) return null;
  const rows = await q(
    `SELECT d.id FROM departments d WHERE d."deletedAt" IS NULL AND (UPPER(d.code) = :c OR d."parentDepartmentId" = (SELECT id FROM departments WHERE UPPER(code) = :c LIMIT 1))`,
    { c: code.toUpperCase() },
  );
  return rows.map((r) => Number(r.id));
}

/** Current value of a target over its period. */
export async function measure(t: any): Promise<number> {
  const { start, end } = periodRange(t);
  if (t.metric === 'manual') return Number(t.manualValue || 0);
  const brand = t.brand ? String(t.brand).toUpperCase() : null;
  const ids = await brandDeptIds(brand);
  const inBrand = (col = '"departmentId"') => (ids ? `AND ${col} IN (:ids)` : '');
  const R = { s: start, e: end, ids: ids && ids.length ? ids : [0] };

  if (t.metric === 'revenue' || t.metric === 'profit') {
    const { monthBuckets, brandMap } = require('./profit');
    const { brands } = await brandMap();
    const brandId = brand ? brands.find((b: any) => String(b.code).toUpperCase() === brand)?.id : null;
    let income = 0; let expenses = 0;
    const cur = new Date(start);
    while (cur < end) {
      const buckets: Map<string, any> = await monthBuckets(cur.getUTCFullYear(), cur.getUTCMonth() + 1);
      for (const [key, b] of buckets.entries()) {
        if (brand && key !== String(brandId)) continue;
        income += Object.values(b.income as Record<string, number>).reduce((x, y) => x + y, 0);
        expenses += Object.values(b.expenses as Record<string, number>).reduce((x, y) => x + y, 0);
      }
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return Math.round(t.metric === 'revenue' ? income : income - expenses);
  }

  const created = (table: string, extra = '') => q(`SELECT COUNT(*)::int v FROM ${table} WHERE "createdAt" >= :s AND "createdAt" < :e ${inBrand()} ${extra}`, R).then(n).catch(() => 0);
  const reachedStage = (table: string, stages: string[], col = 'stage') =>
    q(`SELECT COUNT(*)::int v FROM ${table} WHERE ${col} IN (:st) AND "updatedAt" >= :s AND "updatedAt" < :e ${inBrand()}`, { ...R, st: stages }).then(n).catch(() => 0);

  switch (t.metric) {
    case 'newCustomers': {
      const parts: Record<string, () => Promise<number>> = {
        VM: () => created('erp_travel_cases'),
        KS: async () => (await created('erp_tech_projects')) + (await created('erp_service_subscriptions')),
        BM: async () => (await created('erp_shop_orders')) + (await created('erp_custom_orders')),
        MF: () => created('erp_export_orders'),
      };
      if (brand) return parts[brand] ? parts[brand]() : 0;
      let total = 0; for (const f of Object.values(parts)) total += await f();
      return total;
    }
    case 'orders': {
      const bm = async () => (await created('erp_shop_orders', `AND stage <> 'Cancelled'`)) + (await created('erp_custom_orders', `AND stage <> 'Cancelled'`));
      const mf = () => created('erp_export_orders', `AND stage <> 'Cancelled'`);
      if (brand === 'BM') return bm();
      if (brand === 'MF') return mf();
      return (await bm()) + (await mf());
    }
    case 'students': {
      const codes = brand === 'KS' ? ['KS', 'KS-TRN'] : brand === 'BM' ? ['BM', 'BM-VOC'] : ['KS', 'KS-TRN', 'BM', 'BM-VOC'];
      return q(
        `SELECT COUNT(*)::int v FROM enrollments en JOIN courses c ON c.id = en."courseId" JOIN departments d ON d.id = c."departmentId"
         WHERE en."deletedAt" IS NULL AND en."createdAt" >= :s AND en."createdAt" < :e AND UPPER(d.code) IN (:codes)`, { ...R, codes },
      ).then(n).catch(() => 0);
    }
    case 'visasApproved': return reachedStage('erp_travel_cases', ['Approved', 'Travelled']);
    case 'projectsDelivered': return reachedStage('erp_tech_projects', ['Deployed', 'Completed']);
    default: return 0;
  }
}

export async function targetsWithProgress(where: { year?: number } = {}) {
  const rows: any[] = await (ErpModels.Target as any).findAll({ where: where.year ? { year: where.year } : {}, order: [['year', 'DESC'], ['period', 'ASC'], ['month', 'DESC'], ['quarter', 'DESC'], ['id', 'ASC']], raw: true });
  const now = Date.now();
  const out = [];
  for (const t of rows) {
    const { start, end, label } = periodRange(t);
    const value = await measure(t);
    const target = Number(t.targetValue);
    const elapsed = Math.min(1, Math.max(0, (now - start.getTime()) / (end.getTime() - start.getTime())));
    const pct = target > 0 ? Math.round((value / target) * 1000) / 10 : 0;
    const expected = target * elapsed;
    const status = value >= target ? 'Achieved' : now >= end.getTime() ? 'Missed' : elapsed < 0.05 ? 'Just started' : value >= expected * 0.95 ? 'On track' : value >= expected * 0.7 ? 'Slightly behind' : 'Behind';
    out.push({
      ...t, targetValue: target, manualValue: t.manualValue != null ? Number(t.manualValue) : null,
      metricLabel: METRICS[t.metric]?.label || t.metric, money: !!METRICS[t.metric]?.money,
      periodLabel: label, current: value, percent: pct, elapsedPercent: Math.round(elapsed * 100), status,
      active: now >= start.getTime() && now < end.getTime(),
    });
  }
  return out;
}

const canManage = (req: any) => isManagement(req);
const canSee = (req: any) => isManagement(req) || ['hr', 'hod', 'accountant'].includes(roleOf(req));

function clean(b: any) {
  const period = ['month', 'quarter', 'year'].includes(b.period) ? b.period : 'month';
  const now = new Date();
  return {
    title: String(b.title || '').trim().slice(0, 160),
    brand: ['VM', 'KS', 'BM', 'MF'].includes(String(b.brand || '').toUpperCase()) ? String(b.brand).toUpperCase() : null,
    metric: METRICS[b.metric] ? b.metric : 'revenue',
    period,
    year: Number(b.year) || now.getFullYear(),
    month: period === 'month' ? Math.min(12, Math.max(1, Number(b.month) || now.getMonth() + 1)) : null,
    quarter: period === 'quarter' ? Math.min(4, Math.max(1, Number(b.quarter) || Math.floor(now.getMonth() / 3) + 1)) : null,
    targetValue: Math.max(0, toNum(b.targetValue)),
    manualValue: b.manualValue === '' || b.manualValue === undefined || b.manualValue === null ? null : toNum(b.manualValue),
    notes: b.notes ? String(b.notes).slice(0, 2000) : null,
    ownerUserId: b.ownerUserId ? Number(b.ownerUserId) : null,
  };
}

export function targetsRouter(): Router {
  const r = Router();
  r.get('/targets/meta', wrap(async (_req, res) => ok(res, METRICS)));

  r.get('/targets', wrap(async (req, res) => {
    if (!canSee(req)) return fail(res, 403, 'Targets are visible to management, HR, heads of department and Accounts');
    const year = req.query.year ? Number(req.query.year) : undefined;
    let rows = await targetsWithProgress({ year });
    if (req.query.active === '1') rows = rows.filter((t) => t.active);
    return ok(res, rows);
  }));

  r.post('/targets', wrap(async (req, res) => {
    if (!canManage(req)) return fail(res, 403, 'Only management can set targets');
    const data = clean(req.body || {});
    const NAMES: Record<string, string> = { VM: 'VisaMax', KS: 'Kurios SAT', BM: 'BeadMax', MF: 'Maxfood Farm' };
    if (!data.title) data.title = `${data.brand ? NAMES[data.brand] : 'Whole company'} — ${METRICS[data.metric].label.toLowerCase()}`;
    if (!(data.targetValue > 0)) return fail(res, 400, 'Enter the target amount');
    const row: any = await (ErpModels.Target as any).create({ ...data, createdById: userId(req) });
    await audit(req, 'Targets', 'Create', 'Target', row.id, `${userName(req)} set target “${row.title}”`, data);
    emitChange(req, 'target', 'created', row);
    return ok(res, row, 'Target saved', 201);
  }));

  r.put('/targets/:id(\\d+)', wrap(async (req, res) => {
    const row: any = await (ErpModels.Target as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Target not found');
    // Owners may update the progress of a "manual" target; everything else is management only.
    if (!canManage(req)) {
      if (!(row.metric === 'manual' && Number(row.ownerUserId) === userId(req) && Object.keys(req.body || {}).every((k) => k === 'manualValue'))) {
        return fail(res, 403, 'Only management can change targets');
      }
      await row.update({ manualValue: toNum(req.body.manualValue) });
      return ok(res, row, 'Progress updated');
    }
    const data = clean({ ...row.get({ plain: true }), ...req.body });
    await row.update(data);
    await audit(req, 'Targets', 'Update', 'Target', row.id, `${userName(req)} updated target “${row.title}”`, data);
    emitChange(req, 'target', 'updated', row);
    return ok(res, row, 'Target updated');
  }));

  r.delete('/targets/:id(\\d+)', wrap(async (req, res) => {
    if (!canManage(req)) return fail(res, 403, 'Only management can delete targets');
    const row: any = await (ErpModels.Target as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Target not found');
    await row.destroy();
    await audit(req, 'Targets', 'Delete', 'Target', row.id, `${userName(req)} deleted target “${row.title}”`);
    emitChange(req, 'target', 'deleted', { id: row.id });
    return ok(res, { id: row.id }, 'Target deleted');
  }));
  return r;
}
