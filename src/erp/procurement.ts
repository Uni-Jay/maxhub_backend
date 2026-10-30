import { Router, Request } from 'express';
import { QueryTypes, Op } from 'sequelize';
import { ErpModels } from './models';
import { wrap, ok, fail, brandPrefix } from './recordRouter';
import {
  audit, db, emitChange, headedDepartmentIds, isManagement, nextCode, notifyUsers, roleOf, toNum, userId, userName,
  userIdsWithRoles, departmentHeadUserIds,
} from './helpers';

/**
 * Purchase requests and monthly brand budgets.
 *
 *  Staff ask to buy something → their head of department approves → management
 *  approves anything above the head-of-department limit or over budget → Accounts
 *  buys it and records the receipt, which becomes a business expense (so it shows
 *  in Profit & Loss and against the brand's budget).
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;
const S = {
  HOD: 'Waiting for head of department',
  MGMT: 'Waiting for management',
  APPROVED: 'Approved',
  BOUGHT: 'Bought',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};
const PENDING = [S.HOD, S.MGMT];
export const AWAITING = 'Awaiting payment';
const SETTINGS_KEY = 'purchaseSettings';
const naira = (n: any) => `₦${Math.round(Number(n || 0)).toLocaleString('en-NG')}`;
const isAccounts = (req: Request) => roleOf(req) === 'accountant';
const canSeeAll = (req: Request) => isManagement(req) || isAccounts(req);

export async function purchaseSettings(): Promise<{ hodLimit: number }> {
  const row: any = await ErpModels.Setting?.findByPk(SETTINGS_KEY, { raw: true }).catch(() => null);
  return { hodLimit: 100000, ...(row?.value || {}) };
}

async function staffOf(uid: number) {
  return (await q(`SELECT id, "departmentId", "firstName", "lastName" FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: uid }))[0] || null;
}

/** Top-level department (brand) for any department. */
async function brandIdOf(deptId: any): Promise<number | null> {
  if (!deptId) return null;
  const { brandOfDepartment } = require('./people');
  return brandOfDepartment(deptId);
}

/** All department ids belonging to a brand (the brand and every level below it). */
async function brandFamily(brandId: number): Promise<number[]> {
  const { brandMap } = require('./profit');
  const { map } = await brandMap();
  const ids: number[] = [];
  for (const [dept, top] of map.entries()) if (top === brandId) ids.push(dept);
  return ids.length ? ids : [brandId];
}

const monthStart = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}-01`;
const nextMonthStart = (y: number, m: number) => (m === 12 ? monthStart(y + 1, 1) : monthStart(y, m + 1));

/** Budget for a brand and month — the latest one set on or before that month carries forward. */
export async function budgetFor(brandId: number, year: number, month: number) {
  const row = (await q(
    `SELECT * FROM erp_budgets WHERE "departmentId" = :b AND (year < :y OR (year = :y AND month <= :m)) ORDER BY year DESC, month DESC LIMIT 1`,
    { b: brandId, y: year, m: month },
  ))[0];
  if (!row) return null;
  return {
    amount: Number(row.amount), categories: row.categories || {}, notes: row.notes,
    setFor: `${row.year}-${String(row.month).padStart(2, '0')}`, carried: !(Number(row.year) === year && Number(row.month) === month),
  };
}

/** What a brand has spent (expenses) and committed (approved, not yet bought) in a month. */
export async function spendFor(brandId: number, year: number, month: number) {
  const ids = await brandFamily(brandId);
  const R = { ids, s: monthStart(year, month), e: nextMonthStart(year, month) };
  const spentRows = await q(
    `SELECT category, COALESCE(SUM(COALESCE("amountNgn", CASE WHEN currency = 'NGN' THEN amount END)), 0)::float v
     FROM erp_expenses WHERE "departmentId" IN (:ids) AND status <> 'Cancelled' AND "paidAt" >= :s AND "paidAt" < :e GROUP BY category`, R,
  ).catch(() => [] as any[]);
  const committedRows = await q(
    `SELECT category, COALESCE(SUM(COALESCE("amountNgn", total)), 0)::float v FROM erp_purchase_requests
     WHERE "departmentId" IN (:ids) AND status = :st AND "expenseId" IS NULL GROUP BY category`, { ...R, st: S.APPROVED },
  ).catch(() => [] as any[]);
  const pendingRows = await q(
    `SELECT COALESCE(SUM(COALESCE("amountNgn", total)), 0)::float v, COUNT(*)::int c FROM erp_purchase_requests
     WHERE "departmentId" IN (:ids) AND status IN (:st)`, { ...R, st: PENDING },
  ).catch(() => [] as any[]);
  const byCategory: Record<string, { spent: number; committed: number }> = {};
  for (const r of spentRows) (byCategory[r.category] ||= { spent: 0, committed: 0 }).spent += Number(r.v);
  for (const r of committedRows) (byCategory[r.category] ||= { spent: 0, committed: 0 }).committed += Number(r.v);
  const spent = spentRows.reduce((t, r) => t + Number(r.v), 0);
  const committed = committedRows.reduce((t, r) => t + Number(r.v), 0);
  return { spent, committed, pending: Number(pendingRows[0]?.v || 0), pendingCount: Number(pendingRows[0]?.c || 0), byCategory };
}

/** How a request sits against its brand's budget this month. */
async function budgetCheck(deptId: any, amountNgn: number, category: string, alreadyCounted = false) {
  const brandId = await brandIdOf(deptId);
  if (!brandId) return null;
  const now = new Date();
  const y = now.getFullYear(); const m = now.getMonth() + 1;
  const budget = await budgetFor(brandId, y, m);
  if (!budget) return { brandId, hasBudget: false, over: false };
  const spend = await spendFor(brandId, y, m);
  const used = spend.spent + spend.committed - (alreadyCounted ? amountNgn : 0);
  const left = budget.amount - used;
  const catBudget = Number(budget.categories?.[category] || 0);
  const catUsed = (spend.byCategory[category]?.spent || 0) + (spend.byCategory[category]?.committed || 0) - (alreadyCounted ? amountNgn : 0);
  return {
    brandId, hasBudget: true, budget: budget.amount, used, left, leftAfter: left - amountNgn,
    over: amountNgn > left || (catBudget > 0 && amountNgn > catBudget - catUsed),
    category: catBudget > 0 ? { budget: catBudget, used: catUsed, leftAfter: catBudget - catUsed - amountNgn } : null,
  };
}

function cleanItems(v: any): Array<{ name: string; qty: number; unitPrice: number }> {
  if (!Array.isArray(v)) return [];
  return v.map((i) => ({ name: String(i?.name || '').trim().slice(0, 200), qty: Math.max(0, toNum(i?.qty, 1)), unitPrice: Math.max(0, toNum(i?.unitPrice)) }))
    .filter((i) => i.name && i.qty > 0).slice(0, 50);
}

const push = (row: any, req: Request, action: string, note?: string | null) =>
  [...(row.history || []), { at: new Date().toISOString(), by: userName(req), byId: userId(req), action, note: note || null }];

async function approverIdsFor(row: any): Promise<number[]> {
  if (row.status === S.HOD) return (await departmentHeadUserIds(Number(row.departmentId))).filter((u) => u !== Number(row.requestedById));
  if (row.status === S.MGMT) return userIdsWithRoles(['superadmin', 'admin']);
  return [];
}

async function notifyApprovers(req: Request, row: any) {
  const ids = await approverIdsFor(row);
  if (!ids.length) return;
  await notifyUsers(req, ids, {
    title: 'Purchase request to approve', type: 'Approval', priority: row.urgency === 'Urgent' ? 'High' : 'Medium',
    message: `${row.requestedByName} wants to buy “${row.title}” (${row.currency === 'NGN' ? naira(row.total) : `${row.currency} ${Number(row.total).toLocaleString()}`}).`,
    actionUrl: `/purchases?open=${row.id}`, entityType: 'purchase_request', entityId: row.id,
  }, { excludeSelf: userId(req) });
}

/** What the caller may do with a request. */
async function permissions(req: Request, row: any, headed?: number[]) {
  const me = userId(req);
  const mine = Number(row.requestedById) === me;
  const heads = headed ?? await headedDepartmentIds(me);
  const isHodHere = heads.includes(Number(row.departmentId));
  const canApprove = !mine && ((row.status === S.HOD && (isHodHere || isManagement(req))) || (row.status === S.MGMT && isManagement(req)))
    || (mine && isManagement(req) && PENDING.includes(row.status) && roleOf(req) === 'superadmin');
  return {
    canApprove,
    canBuy: row.status === S.APPROVED && (isAccounts(req) || isManagement(req)),
    canCancel: [...PENDING, S.APPROVED].includes(row.status) && (mine || isManagement(req)),
    canDelete: isManagement(req),
    canSee: mine || canSeeAll(req) || isHodHere,
  };
}


/**
 * Final approval: the request goes straight to Accounts for payment and is added
 * to the month's business expenses (as "Awaiting payment") so the monthly totals,
 * Profit & Loss and budgets include it right away.
 */
async function onApproved(req: Request | null, row: any) {
  if (!row.expenseId) {
    const { toNgn } = require('./fx');
    const total = Number(row.total);
    const conv = row.currency === 'NGN' ? { amountNgn: total, fxRate: 1 } : await toNgn(total, row.currency);
    const expense: any = await ErpModels.Expense.create({
      code: await nextCode(`${await brandPrefix(row.departmentId)}-EXP`), title: row.title, category: row.category,
      vendor: row.vendor || null, amount: total, currency: row.currency, fxRate: conv.fxRate, amountNgn: conv.amountNgn ?? row.amountNgn,
      paidAt: new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }), method: 'Transfer', reference: row.code, status: AWAITING,
      notes: `Purchase request ${row.code} by ${row.requestedByName} — approved, waiting for Accounts to pay`, departmentId: row.departmentId,
      createdById: req ? userId(req) : null, meta: { purchaseRequestId: Number(row.id) },
    } as any);
    await row.update({ expenseId: expense.id });
    emitChange(req, 'business_expense', 'created', expense);
  }
  await notifyUsers(req, await userIdsWithRoles(['accountant']), {
    title: 'Approved purchase — please disburse', type: 'Approval', priority: row.urgency === 'Urgent' ? 'High' : 'Medium',
    message: `${row.code}: “${row.title}” (${naira(row.amountNgn ?? row.total)}) for ${row.requestedByName}. It is already in this month’s expenses as awaiting payment.`,
    actionUrl: `/purchases?open=${row.id}`,
  }, { excludeSelf: req ? userId(req) : undefined });
}

export function procurementRouter(): Router {
  const r = Router();

  r.get('/purchases/meta', wrap(async (req, res) => {
    const { EXPENSE_CATEGORIES } = require('./profit');
    const { brandDepartments } = require('./people');
    const me = await staffOf(userId(req));
    return ok(res, {
      categories: EXPENSE_CATEGORIES, settings: await purchaseSettings(),
      brands: (await brandDepartments()).map((b: any) => ({ id: b.id, code: b.code, name: b.displayName })),
      myDepartmentId: me?.departmentId ? Number(me.departmentId) : null,
      canSeeAll: canSeeAll(req), isManagement: isManagement(req), headed: await headedDepartmentIds(userId(req)),
    });
  }));

  r.get('/purchases', wrap(async (req, res) => {
    const me = userId(req);
    const headed = await headedDepartmentIds(me);
    const where: any = {};
    if (!canSeeAll(req)) where[Op.or] = [{ requestedById: me }, ...(headed.length ? [{ departmentId: { [Op.in]: headed } }] : [])];
    if (req.query.status && req.query.status !== 'All') where.status = String(req.query.status);
    const rows: any[] = await (ErpModels.PurchaseRequest as any).findAll({ where, order: [['createdAt', 'DESC']], limit: 500, raw: true });
    const { brandDepartments } = require('./people');
    const brands = new Map<number, any>((await brandDepartments()).map((b: any) => [b.id, b]));
    const deptNames = new Map((await q(`SELECT id, name FROM departments`)).map((d) => [Number(d.id), d.name]));
    const out = [];
    for (const row of rows) {
      const p = await permissions(req, row, headed);
      const brandId = await brandIdOf(row.departmentId);
      out.push({
        ...row, id: Number(row.id), departmentId: row.departmentId ? Number(row.departmentId) : null, requestedById: Number(row.requestedById), total: Number(row.total), amountNgn: row.amountNgn != null ? Number(row.amountNgn) : null,
        actualAmount: row.actualAmount != null ? Number(row.actualAmount) : null,
        departmentName: deptNames.get(Number(row.departmentId)) || null, brandName: brandId ? brands.get(brandId)?.displayName : null,
        mine: Number(row.requestedById) === me, ...p,
      });
    }
    return ok(res, out);
  }));

  r.get('/purchases/:id(\\d+)', wrap(async (req, res) => {
    const row: any = await (ErpModels.PurchaseRequest as any).findByPk(req.params.id, { raw: true });
    if (!row) return fail(res, 404, 'Purchase request not found');
    const p = await permissions(req, row);
    if (!p.canSee) return fail(res, 403, 'You cannot see this request');
    const budget = await budgetCheck(row.departmentId, Number(row.amountNgn ?? row.total), row.category, row.status === S.APPROVED);
    return ok(res, { ...row, id: Number(row.id), ...p, budget });
  }));

  /** Preview the budget effect before sending. */
  r.post('/purchases/check', wrap(async (req, res) => {
    const b = req.body || {};
    const items = cleanItems(b.items);
    const total = items.length ? items.reduce((t, i) => t + i.qty * i.unitPrice, 0) : Math.max(0, toNum(b.total));
    const { toNgn } = require('./fx');
    const conv = await toNgn(total, b.currency || 'NGN');
    const me = await staffOf(userId(req));
    const dept = b.departmentId ? Number(b.departmentId) : me?.departmentId;
    return ok(res, { total, amountNgn: conv.amountNgn, budget: await budgetCheck(dept, Number(conv.amountNgn ?? total), b.category || 'Other') });
  }));

  r.post('/purchases', wrap(async (req, res) => {
    const b = req.body || {};
    const me = userId(req);
    const staff = await staffOf(me);
    const title = String(b.title || '').trim().slice(0, 200);
    if (!title) return fail(res, 400, 'Say what you want to buy');
    const items = cleanItems(b.items);
    const total = items.length ? items.reduce((t, i) => t + i.qty * i.unitPrice, 0) : Math.max(0, toNum(b.total));
    if (!(total > 0)) return fail(res, 400, 'Enter the cost');
    let departmentId = staff?.departmentId ? Number(staff.departmentId) : null;
    if (b.departmentId) {
      const wanted = Number(b.departmentId);
      const { memberDepartmentIds } = require('./helpers');
      if (canSeeAll(req) || (await memberDepartmentIds(me)).includes(wanted)) departmentId = wanted;
    }
    if (!departmentId) return fail(res, 400, 'Choose which brand this is for');
    const currency = String(b.currency || 'NGN').toUpperCase().slice(0, 3);
    const { toNgn } = require('./fx');
    const conv = await toNgn(total, currency);
    const { EXPENSE_CATEGORIES } = require('./profit');
    const category = EXPENSE_CATEGORIES.includes(b.category) ? b.category : 'Other';

    // Where it starts: management's own requests are approved at once; a head of department's go to management.
    const heads = (await departmentHeadUserIds(departmentId)).filter((u) => u !== me);
    const myHeaded = await headedDepartmentIds(me);
    let status = S.HOD;
    if (isManagement(req)) status = S.APPROVED;
    else if (myHeaded.includes(departmentId) || !heads.length) status = S.MGMT;

    const row: any = await (ErpModels.PurchaseRequest as any).create({
      code: await nextCode(`${await brandPrefix(departmentId)}-PR`), title, items, category, total, currency, amountNgn: conv.amountNgn,
      vendor: b.vendor ? String(b.vendor).slice(0, 160) : null, reason: b.reason ? String(b.reason).slice(0, 4000) : null,
      neededBy: b.neededBy || null, urgency: b.urgency === 'Urgent' ? 'Urgent' : 'Normal', quoteUrl: b.quoteUrl || null,
      status, requestedById: me, requestedByName: userName(req), departmentId,
      history: [{ at: new Date().toISOString(), by: userName(req), byId: me, action: status === S.APPROVED ? 'Requested and approved (management)' : 'Requested', note: null }],
    });
    await audit(req, 'Purchases', 'Create', 'PurchaseRequest', row.id, `${userName(req)} requested to buy “${title}” (${row.code})`, { total, currency, category });
    if (status === S.APPROVED) await onApproved(req, row);
    else await notifyApprovers(req, row);
    emitChange(req, 'purchase_request', 'created', row);
    return ok(res, row, status === S.APPROVED ? 'Request saved and approved' : 'Request sent for approval', 201);
  }));

  r.post('/purchases/:id(\\d+)/decide', wrap(async (req, res) => {
    const row: any = await (ErpModels.PurchaseRequest as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Purchase request not found');
    const p = await permissions(req, row.get({ plain: true }));
    if (!p.canApprove) return fail(res, 403, 'You cannot approve this request at this stage');
    const approve = req.body?.decision === 'approve';
    const note = req.body?.note ? String(req.body.note).slice(0, 2000) : null;
    if (!approve) {
      if (!note) return fail(res, 400, 'Say why you are turning it down');
      await row.update({ status: S.REJECTED, history: push(row, req, 'Rejected', note) });
      await notifyUsers(req, [Number(row.requestedById)], { title: 'Purchase request turned down', message: `${row.code} “${row.title}”: ${note}`, type: 'Alert', actionUrl: `/purchases?open=${row.id}` }, { excludeSelf: userId(req) });
      await audit(req, 'Purchases', 'Reject', 'PurchaseRequest', row.id, `${userName(req)} rejected ${row.code}`, { note });
      emitChange(req, 'purchase_request', 'updated', row);
      return ok(res, row, 'Request turned down');
    }
    let next = S.APPROVED;
    let why: string | null = note;
    if (row.status === S.HOD && !isManagement(req)) {
      const { hodLimit } = await purchaseSettings();
      const amt = Number(row.amountNgn ?? row.total);
      const check = await budgetCheck(row.departmentId, amt, row.category);
      if (amt > hodLimit || check?.over) {
        next = S.MGMT;
        why = [note, amt > hodLimit ? `Above ${naira(hodLimit)}, so management must also approve` : 'Over this month\'s budget, so management must also approve'].filter(Boolean).join(' — ');
      }
    }
    await row.update({ status: next, history: push(row, req, next === S.APPROVED ? 'Approved' : 'Approved by head of department', why) });
    await audit(req, 'Purchases', 'Approve', 'PurchaseRequest', row.id, `${userName(req)} approved ${row.code}${next === S.MGMT ? ' (sent to management)' : ''}`);
    if (next === S.MGMT) await notifyApprovers(req, row);
    else {
      await notifyUsers(req, [Number(row.requestedById)], { title: 'Purchase request approved', message: `${row.code} “${row.title}” is approved and has gone to Accounts for payment.`, type: 'Approval', actionUrl: `/purchases?open=${row.id}` }, { excludeSelf: userId(req) });
      await onApproved(req, row);
    }
    emitChange(req, 'purchase_request', 'updated', row);
    return ok(res, row, next === S.APPROVED ? 'Approved' : 'Approved and sent to management');
  }));

  /** Accounts records the purchase — it becomes a business expense. */
  r.post('/purchases/:id(\\d+)/bought', wrap(async (req, res) => {
    const row: any = await (ErpModels.PurchaseRequest as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Purchase request not found');
    const p = await permissions(req, row.get({ plain: true }));
    if (!p.canBuy) return fail(res, 403, 'Only Accounts or management can record the purchase once it is approved');
    const b = req.body || {};
    const amount = toNum(b.actualAmount, Number(row.total));
    if (!(amount > 0)) return fail(res, 400, 'Enter what was paid');
    const paidAt = b.boughtAt || new Date().toISOString().slice(0, 10);
    const { toNgn } = require('./fx');
    const conv = row.currency === 'NGN' ? { amountNgn: amount, fxRate: 1 } : await toNgn(amount, row.currency);
    const paid = {
      vendor: b.vendor || row.vendor || null, amount, currency: row.currency, fxRate: conv.fxRate, amountNgn: conv.amountNgn,
      paidAt, method: b.method || 'Transfer', reference: row.code, receiptUrl: b.receiptUrl || null, status: 'Paid',
      notes: `Purchase request ${row.code} by ${row.requestedByName}`,
    };
    let expense: any = row.expenseId ? await ErpModels.Expense.findByPk(row.expenseId) : null;
    if (expense) await expense.update(paid);
    else {
      expense = await ErpModels.Expense.create({
        code: await nextCode(`${await brandPrefix(row.departmentId)}-EXP`), title: row.title, category: row.category, ...paid,
        departmentId: row.departmentId, createdById: userId(req), meta: { purchaseRequestId: Number(row.id) },
      } as any);
    }
    await row.update({
      status: S.BOUGHT, actualAmount: amount, boughtAt: paidAt, receiptUrl: b.receiptUrl || null, vendor: b.vendor || row.vendor,
      expenseId: expense.id, history: push(row, req, 'Paid out', `Paid ${row.currency === 'NGN' ? naira(amount) : `${row.currency} ${amount.toLocaleString()}`} — expense ${expense.code}`),
    });
    await audit(req, 'Purchases', 'Bought', 'PurchaseRequest', row.id, `${userName(req)} recorded purchase ${row.code} (expense ${expense.code})`, { amount });
    await notifyUsers(req, [Number(row.requestedById)], { title: 'Your purchase has been paid', message: `${row.code} “${row.title}” has been paid out by Accounts.`, type: 'System', actionUrl: `/purchases?open=${row.id}` }, { excludeSelf: userId(req) });
    emitChange(req, 'purchase_request', 'updated', row);
    emitChange(req, 'business_expense', 'updated', expense);
    return ok(res, { request: row, expense }, 'Payment recorded — the expense is now marked Paid');
  }));

  r.post('/purchases/:id(\\d+)/cancel', wrap(async (req, res) => {
    const row: any = await (ErpModels.PurchaseRequest as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Purchase request not found');
    const p = await permissions(req, row.get({ plain: true }));
    if (!p.canCancel) return fail(res, 403, 'This request can no longer be cancelled');
    await row.update({ status: S.CANCELLED, history: push(row, req, 'Cancelled', req.body?.note) });
    if (row.expenseId) await db.query(`UPDATE erp_expenses SET status = 'Cancelled', "updatedAt" = NOW() WHERE id = :id AND status <> 'Paid'`, { replacements: { id: row.expenseId } });
    await audit(req, 'Purchases', 'Cancel', 'PurchaseRequest', row.id, `${userName(req)} cancelled ${row.code}`);
    emitChange(req, 'purchase_request', 'updated', row);
    return ok(res, row, 'Request cancelled');
  }));

  r.delete('/purchases/:id(\\d+)', wrap(async (req, res) => {
    if (!isManagement(req)) return fail(res, 403, 'Only management can delete purchase requests');
    const row: any = await (ErpModels.PurchaseRequest as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Purchase request not found');
    await row.destroy();
    await audit(req, 'Purchases', 'Delete', 'PurchaseRequest', row.id, `${userName(req)} deleted ${row.code}`);
    emitChange(req, 'purchase_request', 'deleted', { id: row.id });
    return ok(res, { id: row.id }, 'Request deleted');
  }));

  r.put('/purchases/settings', wrap(async (req, res) => {
    if (!isManagement(req)) return fail(res, 403, 'Only management can change approval limits');
    const value = { hodLimit: Math.max(0, toNum(req.body?.hodLimit, 100000)) };
    await (ErpModels.Setting as any).upsert({ key: SETTINGS_KEY, value });
    await audit(req, 'Purchases', 'Update', 'Settings', SETTINGS_KEY, `${userName(req)} set the head-of-department purchase limit to ${naira(value.hodLimit)}`);
    return ok(res, value, 'Limit saved');
  }));

  // ── Budgets ─────────────────────────────────────────────────────────────
  r.get('/budgets', wrap(async (req, res) => {
    const headed = await headedDepartmentIds(userId(req));
    if (!canSeeAll(req) && !headed.length) return fail(res, 403, 'Budgets are for management, Accounts and heads of department');
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const { brandDepartments } = require('./people');
    let brands = await brandDepartments();
    if (!canSeeAll(req)) brands = brands.filter((b: any) => headed.includes(b.id));
    const out = [];
    for (const b of brands) {
      const budget = await budgetFor(b.id, year, month);
      const spend = await spendFor(b.id, year, month);
      const used = spend.spent + spend.committed;
      out.push({
        brandId: b.id, code: b.code, name: b.displayName, logoUrl: b.logoUrl, color: b.primaryColor,
        budget: budget?.amount ?? null, categories: budget?.categories || {}, carried: budget?.carried ?? false, setFor: budget?.setFor ?? null, notes: budget?.notes ?? null,
        ...spend, used, left: budget ? budget.amount - used : null, percent: budget && budget.amount > 0 ? Math.round((used / budget.amount) * 1000) / 10 : null,
      });
    }
    return ok(res, { year, month, brands: out, canEdit: canSeeAll(req) });
  }));

  r.put('/budgets/:brandId(\\d+)', wrap(async (req, res) => {
    if (!canSeeAll(req)) return fail(res, 403, 'Only management and Accounts can set budgets');
    const b = req.body || {};
    const now = new Date();
    const year = Number(b.year) || now.getFullYear();
    const month = Math.min(12, Math.max(1, Number(b.month) || now.getMonth() + 1));
    const categories: Record<string, number> = {};
    for (const [k, v] of Object.entries(b.categories || {})) if (toNum(v) > 0) categories[String(k).slice(0, 60)] = toNum(v);
    const data = { departmentId: Number(req.params.brandId), year, month, amount: Math.max(0, toNum(b.amount)), categories, notes: b.notes ? String(b.notes).slice(0, 2000) : null, updatedById: userId(req) };
    const existing: any = await (ErpModels.Budget as any).findOne({ where: { departmentId: data.departmentId, year, month } });
    if (existing) await existing.update(data); else await (ErpModels.Budget as any).create(data);
    await audit(req, 'Budgets', existing ? 'Update' : 'Create', 'Budget', data.departmentId, `${userName(req)} set the ${year}-${String(month).padStart(2, '0')} budget to ${naira(data.amount)}`, data);
    emitChange(req, 'budget', 'updated', { id: data.departmentId });
    return ok(res, data, 'Budget saved');
  }));

  return r;
}
