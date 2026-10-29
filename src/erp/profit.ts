import { Router, Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import { buildRecordRouter, wrap, ok, fail } from './recordRouter';
import { db, isManagement, roleOf, toNum } from './helpers';

/**
 * Monthly profit & loss for each brand (all figures in naira).
 *  Income   = Payments & Receipts + school fees + invoice payments
 *  Expenses = business expenses (recorded here) + payroll for staff the
 *             brand employs + approved staff expense claims
 * Costs not tied to a brand (Head Office) are shown separately and can be
 * shared equally across the brands.
 */

export const EXPENSE_CATEGORIES = [
  'Rent', 'Stock & materials', 'Transport & logistics', 'Shipping & freight', 'Marketing & adverts', 'Utilities & internet',
  'Fuel & generator', 'Repairs & maintenance', 'Embassy & visa fees', 'Software & hosting', 'Equipment', 'Training',
  'Bank charges', 'Taxes & levies', 'Professional fees', 'Welfare & refreshments', 'Other',
];

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;
const safeQ = (sql: string, replacements: any = {}) => q(sql, replacements).catch((e) => { console.error('[profit]', e.message); return [] as any[]; });
const canSee = (req: any) => isManagement(req) || roleOf(req) === 'accountant';

/** department id → brand department id (top level). */
async function brandMap(): Promise<{ map: Map<number, number>; brands: Array<{ id: number; code: string; name: string; logoUrl: string | null; color: string | null }> }> {
  const depts = await q(`SELECT id, "parentDepartmentId" AS p FROM departments WHERE "deletedAt" IS NULL`);
  const parent = new Map(depts.map((d) => [Number(d.id), d.p ? Number(d.p) : null]));
  const map = new Map<number, number>();
  for (const d of depts) {
    let cur = Number(d.id); let guard = 0;
    while (parent.get(cur) && guard++ < 10) cur = parent.get(cur)!;
    map.set(Number(d.id), cur);
  }
  const brands = (await q(
    `SELECT d.id, d.code, COALESCE(bp."displayName", d.name) AS name, bp."logoUrl", bp."primaryColor" AS color
     FROM departments d JOIN erp_brand_profiles bp ON bp."departmentId" = d.id
     WHERE d."deletedAt" IS NULL AND d."parentDepartmentId" IS NULL
     ORDER BY CASE UPPER(d.code) WHEN 'VM' THEN 1 WHEN 'KS' THEN 2 WHEN 'BM' THEN 3 WHEN 'MF' THEN 4 ELSE 5 END`,
  )).map((b) => ({ ...b, id: Number(b.id) }));
  return { map, brands };
}

function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

interface Bucket { income: Record<string, number>; expenses: Record<string, number> }
const empty = (): Bucket => ({ income: {}, expenses: {} });
const add = (rec: Record<string, number>, k: string, v: number) => { rec[k] = (rec[k] || 0) + (Number(v) || 0); };
const sum = (rec: Record<string, number>) => Object.values(rec).reduce((t, v) => t + v, 0);

/** Income and expenses per brand ('HO' = not tied to a brand) for one month. */
export async function monthBuckets(year: number, month: number): Promise<Map<string, Bucket>> {
  const { map } = await brandMap();
  const brandOf = (dept: any) => (dept ? String(map.get(Number(dept)) ?? 'HO') : 'HO');
  const { start, end } = monthRange(year, month);
  const R = { s: start, e: end };
  const out = new Map<string, Bucket>();
  const b = (k: string) => { if (!out.has(k)) out.set(k, empty()); return out.get(k)!; };

  for (const r of await safeQ(
    `SELECT "departmentId" AS d, SUM(COALESCE("amountNgn", CASE WHEN currency = 'NGN' THEN amount END, 0)) AS v
     FROM erp_payments WHERE status = 'Completed' AND "paidAt" >= :s AND "paidAt" < :e GROUP BY 1`, R)) add(b(brandOf(r.d)).income, 'Payments & receipts', r.v);

  for (const r of await safeQ(
    `SELECT c."departmentId" AS d, SUM(fr."amountPaid") AS v FROM fee_receipts fr
     JOIN enrollments en ON en.id = fr."enrollmentId" JOIN courses c ON c.id = en."courseId"
     WHERE fr."deletedAt" IS NULL AND fr."paymentDate" >= :s AND fr."paymentDate" < :e GROUP BY 1`, R)) add(b(brandOf(r.d)).income, 'School fees', r.v);

  for (const r of await safeQ(
    `SELECT i."departmentId" AS d, SUM(p.amount) AS v FROM payments p LEFT JOIN invoices i ON i.id = p."invoiceId"
     WHERE p."deletedAt" IS NULL AND p.status = 'Processed' AND COALESCE(p.currency, 'NGN') = 'NGN' AND p."paymentDate" >= :s AND p."paymentDate" < :e GROUP BY 1`, R)) add(b(brandOf(r.d)).income, 'Invoice payments', r.v);

  for (const r of await safeQ(
    `SELECT "departmentId" AS d, category, SUM(COALESCE("amountNgn", CASE WHEN currency = 'NGN' THEN amount END, 0)) AS v
     FROM erp_expenses WHERE COALESCE(status, 'Paid') <> 'Cancelled' AND "paidAt" >= :s AND "paidAt" < :e GROUP BY 1, 2`, R)) add(b(brandOf(r.d)).expenses, r.category || 'Other', r.v);

  for (const r of await safeQ(
    `SELECT s."departmentId" AS d, SUM(es."grossSalary") AS v FROM employee_salaries es
     JOIN payroll_periods pp ON pp.id = es."payrollPeriodId" JOIN staff s ON s.id = es."staffId"
     WHERE es."deletedAt" IS NULL AND pp."deletedAt" IS NULL AND pp.year = :y AND pp.month = :m GROUP BY 1`, { y: year, m: month })) add(b(brandOf(r.d)).expenses, 'Salaries', r.v);

  for (const r of await safeQ(
    `SELECT s."departmentId" AS d, SUM(x.amount) AS v FROM expenses x JOIN staff s ON s.id = x."staffId"
     WHERE x."deletedAt" IS NULL AND x.status IN ('Approved', 'Reimbursed') AND COALESCE(x.currency, 'NGN') = 'NGN'
       AND x."expenseDate" >= :s AND x."expenseDate" < :e GROUP BY 1`, R)) add(b(brandOf(r.d)).expenses, 'Staff expense claims', r.v);

  return out;
}

function summarize(bucket: Bucket) {
  const income = sum(bucket.income); const expenses = sum(bucket.expenses);
  return { income, expenses, profit: income - expenses, margin: income ? Math.round(((income - expenses) / income) * 1000) / 10 : null, incomeLines: bucket.income, expenseLines: bucket.expenses };
}

/** Short operating figures for each brand's month. */
async function insights(year: number, month: number) {
  const { start, end } = monthRange(year, month);
  const R = { s: start, e: end };
  const one = async (sql: string, rep: any = R) => (await safeQ(sql, rep))[0] || {};
  const vm = await one(
    `SELECT COUNT(*) FILTER (WHERE "createdAt" >= :s AND "createdAt" < :e)::int AS "newCustomers",
            COUNT(*) FILTER (WHERE stage = 'Approved' AND "updatedAt" >= :s AND "updatedAt" < :e)::int AS approved,
            COUNT(*) FILTER (WHERE stage = 'Rejected' AND "updatedAt" >= :s AND "updatedAt" < :e)::int AS rejected,
            COUNT(*) FILTER (WHERE stage NOT IN ('Approved','Rejected','Travelled','Closed'))::int AS "inProgress"
     FROM erp_travel_cases`);
  const vmTop = await safeQ(`SELECT "destinationCountry" AS name, COUNT(*)::int AS n FROM erp_travel_cases WHERE "createdAt" >= :s AND "createdAt" < :e AND "destinationCountry" IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 3`, R);
  const ks = await one(
    `SELECT (SELECT COUNT(*) FROM erp_tech_projects WHERE "deliveredDate" >= :s AND "deliveredDate" < :e)::int AS delivered,
            (SELECT COUNT(*) FROM erp_tech_projects WHERE stage NOT IN ('Completed','Delivered','Closed','Cancelled'))::int AS "activeProjects",
            (SELECT COUNT(*) FROM erp_service_subscriptions WHERE status IN ('Active','Expiring'))::int AS subscriptions,
            (SELECT COUNT(*) FROM erp_support_tickets WHERE "resolvedAt" >= :s AND "resolvedAt" < :e)::int AS "ticketsResolved"`);
  const school = async (codes: string[]) => (await one(
    `SELECT COUNT(*)::int AS n FROM enrollments en JOIN courses c ON c.id = en."courseId" JOIN departments d ON d.id = c."departmentId"
     WHERE en."deletedAt" IS NULL AND UPPER(d.code) IN (:codes) AND en."createdAt" >= :s AND en."createdAt" < :e`, { ...R, codes })).n || 0;
  const bm = await one(
    `SELECT (SELECT COUNT(*) FROM erp_custom_orders WHERE stage = 'Delivered' AND "updatedAt" >= :s AND "updatedAt" < :e)::int AS "customDelivered",
            (SELECT COUNT(*) FROM erp_shop_orders WHERE stage <> 'Cancelled' AND "createdAt" >= :s AND "createdAt" < :e)::int AS "shopOrders",
            (SELECT COALESCE(SUM(total),0) FROM erp_shop_orders WHERE stage <> 'Cancelled' AND "createdAt" >= :s AND "createdAt" < :e)::float AS "shopValue"`);
  const bmTop = await safeQ(
    `SELECT i->>'name' AS name, SUM((i->>'qty')::numeric)::int AS n FROM erp_shop_orders o, jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) i
     WHERE o.stage <> 'Cancelled' AND o."createdAt" >= :s AND o."createdAt" < :e GROUP BY 1 ORDER BY 2 DESC LIMIT 3`, R);
  const mf = await one(
    `SELECT COUNT(*) FILTER (WHERE "shipDate" >= :s AND "shipDate" < :e)::int AS shipped,
            COALESCE(SUM("totalWeightKg") FILTER (WHERE "shipDate" >= :s AND "shipDate" < :e), 0)::float AS kg,
            COUNT(*) FILTER (WHERE stage NOT IN ('Delivered','Cancelled'))::int AS "openOrders"
     FROM erp_export_orders`);
  const mfTop = await safeQ(`SELECT "destinationCountry" AS name, COUNT(*)::int AS n FROM erp_export_orders WHERE "createdAt" >= :s AND "createdAt" < :e GROUP BY 1 ORDER BY 2 DESC LIMIT 3`, R);
  const pct = (a: number, b: number) => (a + b ? Math.round((a / (a + b)) * 100) : null);
  return {
    VM: [
      { label: 'New customers', value: vm.newCustomers ?? 0 },
      { label: 'Visas approved', value: vm.approved ?? 0, hint: pct(vm.approved || 0, vm.rejected || 0) !== null ? `${pct(vm.approved || 0, vm.rejected || 0)}% approval rate` : undefined },
      { label: 'Applications in progress', value: vm.inProgress ?? 0 },
      { label: 'Top destinations', text: vmTop.map((t) => `${t.name} (${t.n})`).join(', ') || '—' },
    ],
    KS: [
      { label: 'Projects delivered', value: ks.delivered ?? 0 },
      { label: 'Active projects', value: ks.activeProjects ?? 0 },
      { label: 'Active hosting/support plans', value: ks.subscriptions ?? 0 },
      { label: 'New training students', value: await school(['KS-TRN', 'KS']) },
    ],
    BM: [
      { label: 'Online/shop orders', value: bm.shopOrders ?? 0, hint: bm.shopValue ? `₦${Math.round(bm.shopValue).toLocaleString()}` : undefined },
      { label: 'Custom orders delivered', value: bm.customDelivered ?? 0 },
      { label: 'New vocational students', value: await school(['BM-VOC']) },
      { label: 'Best sellers', text: bmTop.map((t) => `${t.name} (${t.n})`).join(', ') || '—' },
    ],
    MF: [
      { label: 'Orders shipped', value: mf.shipped ?? 0 },
      { label: 'Weight shipped', text: `${Math.round(mf.kg || 0).toLocaleString()} kg` },
      { label: 'Open export orders', value: mf.openOrders ?? 0 },
      { label: 'Top destinations', text: mfTop.map((t) => `${t.name} (${t.n})`).join(', ') || '—' },
    ],
  } as Record<string, any[]>;
}

export function profitRouter(): Router {
  const r = Router();

  const guard = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' ? canSee(req) || roleOf(req) === 'hod' : canSee(req) || roleOf(req) === 'hod') return next();
    return fail(res, 403, 'Only management, heads of department and Accounts can record business expenses');
  };
  r.use('/expenses', guard, buildRecordRouter({
    model: 'Expense', entity: 'business_expense', label: 'Expense', codeSuffix: 'EXP',
    searchFields: ['title', 'vendor', 'category', 'reference'], filterFields: ['category', 'recurring', 'status'],
    actionUrl: (row) => `/finance/expenses?open=${row.id}`,
    beforeSave: async (data, existing) => {
      const amount = data.amount !== undefined ? toNum(data.amount) : toNum(existing?.amount);
      const currency = String(data.currency || existing?.currency || 'NGN').toUpperCase();
      const custom = toNum(data.fxRate);
      if (currency === 'NGN') { data.fxRate = 1; data.amountNgn = amount; } else if (custom > 0) { data.amountNgn = Math.round(amount * custom * 100) / 100; } else {
        const { toNgn } = require('./fx');
        const conv = await toNgn(amount, currency);
        data.fxRate = conv.fxRate; data.amountNgn = conv.amountNgn;
      }
      if (!data.paidAt && !existing) data.paidAt = new Date().toISOString().slice(0, 10);
    },
  }));

  r.get('/expense-categories', wrap(async (_req, res) => ok(res, EXPENSE_CATEGORIES)));

  /** GET /erp/profit?year=2026&month=10&share=1 */
  r.get('/profit', wrap(async (req, res) => {
    // Foreign money recorded before a rate was known gets its naira value now.
    const fx = require('./fx');
    await fx.backfillPaymentNgn('erp_payments').catch(() => 0);
    await fx.backfillPaymentNgn('erp_expenses').catch(() => 0);
    if (!canSee(req)) return fail(res, 403, 'Only management and Accounts can see profit & loss');
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Math.min(12, Math.max(1, Number(req.query.month) || now.getMonth() + 1));
    const share = req.query.share === '1';
    const { brands } = await brandMap();

    const build = async (y: number, m: number) => {
      const buckets = await monthBuckets(y, m);
      const ho = buckets.get('HO') || empty();
      const rows = brands.map((b) => {
        const bucket = buckets.get(String(b.id)) || empty();
        const copy: Bucket = { income: { ...bucket.income }, expenses: { ...bucket.expenses } };
        if (share && brands.length) for (const [k, v] of Object.entries(ho.expenses)) add(copy.expenses, `${k} (shared)`, v / brands.length);
        return { ...b, ...summarize(copy) };
      });
      // Income that is not tied to a brand is always shown under Head Office.
      const headOffice = summarize(share ? { income: ho.income, expenses: {} } : ho);
      const all: Bucket = empty();
      for (const bk of buckets.values()) { for (const [k, v] of Object.entries(bk.income)) add(all.income, k, v); for (const [k, v] of Object.entries(bk.expenses)) add(all.expenses, k, v); }
      return { rows, headOffice, company: summarize(all) };
    };

    const current = await build(year, month);
    const prevDate = new Date(Date.UTC(year, month - 2, 1));
    const previous = await build(prevDate.getUTCFullYear(), prevDate.getUTCMonth() + 1);

    // Last 12 months for the trend chart.
    const trend: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(year, month - 1 - i, 1));
      const y = d.getUTCFullYear(); const m = d.getUTCMonth() + 1;
      const buckets = await monthBuckets(y, m);
      const perBrand: Record<string, number> = {};
      let inc = 0; let exp = 0;
      for (const b of brands) { const s = summarize(buckets.get(String(b.id)) || empty()); perBrand[b.code] = s.profit; }
      for (const bk of buckets.values()) { inc += sum(bk.income); exp += sum(bk.expenses); }
      trend.push({ year: y, month: m, income: inc, expenses: exp, profit: inc - exp, perBrand });
    }

    return ok(res, {
      year, month, share, brands: current.rows, headOffice: current.headOffice, company: current.company,
      previous: { brands: previous.rows.map((r: any) => ({ code: r.code, income: r.income, expenses: r.expenses, profit: r.profit })), company: previous.company },
      trend, insights: await insights(year, month),
    });
  }));

  return r;
}
