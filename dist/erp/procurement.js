"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseSettings = purchaseSettings;
exports.budgetFor = budgetFor;
exports.spendFor = spendFor;
exports.procurementRouter = procurementRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const S = {
    HOD: 'Waiting for head of department',
    MGMT: 'Waiting for management',
    APPROVED: 'Approved',
    BOUGHT: 'Bought',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
};
const PENDING = [S.HOD, S.MGMT];
const SETTINGS_KEY = 'purchaseSettings';
const naira = (n) => `₦${Math.round(Number(n || 0)).toLocaleString('en-NG')}`;
const isAccounts = (req) => (0, helpers_1.roleOf)(req) === 'accountant';
const canSeeAll = (req) => (0, helpers_1.isManagement)(req) || isAccounts(req);
async function purchaseSettings() {
    const row = await models_1.ErpModels.Setting?.findByPk(SETTINGS_KEY, { raw: true }).catch(() => null);
    return { hodLimit: 100000, ...(row?.value || {}) };
}
async function staffOf(uid) {
    return (await q(`SELECT id, "departmentId", "firstName", "lastName" FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: uid }))[0] || null;
}
async function brandIdOf(deptId) {
    if (!deptId)
        return null;
    const { brandOfDepartment } = require('./people');
    return brandOfDepartment(deptId);
}
async function brandFamily(brandId) {
    const { brandMap } = require('./profit');
    const { map } = await brandMap();
    const ids = [];
    for (const [dept, top] of map.entries())
        if (top === brandId)
            ids.push(dept);
    return ids.length ? ids : [brandId];
}
const monthStart = (y, m) => `${y}-${String(m).padStart(2, '0')}-01`;
const nextMonthStart = (y, m) => (m === 12 ? monthStart(y + 1, 1) : monthStart(y, m + 1));
async function budgetFor(brandId, year, month) {
    const row = (await q(`SELECT * FROM erp_budgets WHERE "departmentId" = :b AND (year < :y OR (year = :y AND month <= :m)) ORDER BY year DESC, month DESC LIMIT 1`, { b: brandId, y: year, m: month }))[0];
    if (!row)
        return null;
    return {
        amount: Number(row.amount), categories: row.categories || {}, notes: row.notes,
        setFor: `${row.year}-${String(row.month).padStart(2, '0')}`, carried: !(Number(row.year) === year && Number(row.month) === month),
    };
}
async function spendFor(brandId, year, month) {
    var _a, _b;
    const ids = await brandFamily(brandId);
    const R = { ids, s: monthStart(year, month), e: nextMonthStart(year, month) };
    const spentRows = await q(`SELECT category, COALESCE(SUM(COALESCE("amountNgn", CASE WHEN currency = 'NGN' THEN amount END)), 0)::float v
     FROM erp_expenses WHERE "departmentId" IN (:ids) AND status <> 'Cancelled' AND "paidAt" >= :s AND "paidAt" < :e GROUP BY category`, R).catch(() => []);
    const committedRows = await q(`SELECT category, COALESCE(SUM(COALESCE("amountNgn", total)), 0)::float v FROM erp_purchase_requests
     WHERE "departmentId" IN (:ids) AND status = :st GROUP BY category`, { ...R, st: S.APPROVED }).catch(() => []);
    const pendingRows = await q(`SELECT COALESCE(SUM(COALESCE("amountNgn", total)), 0)::float v, COUNT(*)::int c FROM erp_purchase_requests
     WHERE "departmentId" IN (:ids) AND status IN (:st)`, { ...R, st: PENDING }).catch(() => []);
    const byCategory = {};
    for (const r of spentRows)
        (byCategory[_a = r.category] || (byCategory[_a] = { spent: 0, committed: 0 })).spent += Number(r.v);
    for (const r of committedRows)
        (byCategory[_b = r.category] || (byCategory[_b] = { spent: 0, committed: 0 })).committed += Number(r.v);
    const spent = spentRows.reduce((t, r) => t + Number(r.v), 0);
    const committed = committedRows.reduce((t, r) => t + Number(r.v), 0);
    return { spent, committed, pending: Number(pendingRows[0]?.v || 0), pendingCount: Number(pendingRows[0]?.c || 0), byCategory };
}
async function budgetCheck(deptId, amountNgn, category, alreadyCounted = false) {
    const brandId = await brandIdOf(deptId);
    if (!brandId)
        return null;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const budget = await budgetFor(brandId, y, m);
    if (!budget)
        return { brandId, hasBudget: false, over: false };
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
function cleanItems(v) {
    if (!Array.isArray(v))
        return [];
    return v.map((i) => ({ name: String(i?.name || '').trim().slice(0, 200), qty: Math.max(0, (0, helpers_1.toNum)(i?.qty, 1)), unitPrice: Math.max(0, (0, helpers_1.toNum)(i?.unitPrice)) }))
        .filter((i) => i.name && i.qty > 0).slice(0, 50);
}
const push = (row, req, action, note) => [...(row.history || []), { at: new Date().toISOString(), by: (0, helpers_1.userName)(req), byId: (0, helpers_1.userId)(req), action, note: note || null }];
async function approverIdsFor(row) {
    if (row.status === S.HOD)
        return (await (0, helpers_1.departmentHeadUserIds)(Number(row.departmentId))).filter((u) => u !== Number(row.requestedById));
    if (row.status === S.MGMT)
        return (0, helpers_1.userIdsWithRoles)(['superadmin', 'admin']);
    return [];
}
async function notifyApprovers(req, row) {
    const ids = await approverIdsFor(row);
    if (!ids.length)
        return;
    await (0, helpers_1.notifyUsers)(req, ids, {
        title: 'Purchase request to approve', type: 'Approval', priority: row.urgency === 'Urgent' ? 'High' : 'Medium',
        message: `${row.requestedByName} wants to buy “${row.title}” (${row.currency === 'NGN' ? naira(row.total) : `${row.currency} ${Number(row.total).toLocaleString()}`}).`,
        actionUrl: `/purchases?open=${row.id}`, entityType: 'purchase_request', entityId: row.id,
    }, { excludeSelf: (0, helpers_1.userId)(req) });
}
async function permissions(req, row, headed) {
    const me = (0, helpers_1.userId)(req);
    const mine = Number(row.requestedById) === me;
    const heads = headed ?? await (0, helpers_1.headedDepartmentIds)(me);
    const isHodHere = heads.includes(Number(row.departmentId));
    const canApprove = !mine && ((row.status === S.HOD && (isHodHere || (0, helpers_1.isManagement)(req))) || (row.status === S.MGMT && (0, helpers_1.isManagement)(req)))
        || (mine && (0, helpers_1.isManagement)(req) && PENDING.includes(row.status) && (0, helpers_1.roleOf)(req) === 'superadmin');
    return {
        canApprove,
        canBuy: row.status === S.APPROVED && (isAccounts(req) || (0, helpers_1.isManagement)(req)),
        canCancel: [...PENDING, S.APPROVED].includes(row.status) && (mine || (0, helpers_1.isManagement)(req)),
        canDelete: (0, helpers_1.isManagement)(req),
        canSee: mine || canSeeAll(req) || isHodHere,
    };
}
function procurementRouter() {
    const r = (0, express_1.Router)();
    r.get('/purchases/meta', (0, recordRouter_1.wrap)(async (req, res) => {
        const { EXPENSE_CATEGORIES } = require('./profit');
        const { brandDepartments } = require('./people');
        const me = await staffOf((0, helpers_1.userId)(req));
        return (0, recordRouter_1.ok)(res, {
            categories: EXPENSE_CATEGORIES, settings: await purchaseSettings(),
            brands: (await brandDepartments()).map((b) => ({ id: b.id, code: b.code, name: b.displayName })),
            myDepartmentId: me?.departmentId ? Number(me.departmentId) : null,
            canSeeAll: canSeeAll(req), isManagement: (0, helpers_1.isManagement)(req), headed: await (0, helpers_1.headedDepartmentIds)((0, helpers_1.userId)(req)),
        });
    }));
    r.get('/purchases', (0, recordRouter_1.wrap)(async (req, res) => {
        const me = (0, helpers_1.userId)(req);
        const headed = await (0, helpers_1.headedDepartmentIds)(me);
        const where = {};
        if (!canSeeAll(req))
            where[sequelize_1.Op.or] = [{ requestedById: me }, ...(headed.length ? [{ departmentId: { [sequelize_1.Op.in]: headed } }] : [])];
        if (req.query.status && req.query.status !== 'All')
            where.status = String(req.query.status);
        const rows = await models_1.ErpModels.PurchaseRequest.findAll({ where, order: [['createdAt', 'DESC']], limit: 500, raw: true });
        const { brandDepartments } = require('./people');
        const brands = new Map((await brandDepartments()).map((b) => [b.id, b]));
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
        return (0, recordRouter_1.ok)(res, out);
    }));
    r.get('/purchases/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.PurchaseRequest.findByPk(req.params.id, { raw: true });
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Purchase request not found');
        const p = await permissions(req, row);
        if (!p.canSee)
            return (0, recordRouter_1.fail)(res, 403, 'You cannot see this request');
        const budget = await budgetCheck(row.departmentId, Number(row.amountNgn ?? row.total), row.category, row.status === S.APPROVED);
        return (0, recordRouter_1.ok)(res, { ...row, id: Number(row.id), ...p, budget });
    }));
    r.post('/purchases/check', (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        const items = cleanItems(b.items);
        const total = items.length ? items.reduce((t, i) => t + i.qty * i.unitPrice, 0) : Math.max(0, (0, helpers_1.toNum)(b.total));
        const { toNgn } = require('./fx');
        const conv = await toNgn(total, b.currency || 'NGN');
        const me = await staffOf((0, helpers_1.userId)(req));
        const dept = b.departmentId ? Number(b.departmentId) : me?.departmentId;
        return (0, recordRouter_1.ok)(res, { total, amountNgn: conv.amountNgn, budget: await budgetCheck(dept, Number(conv.amountNgn ?? total), b.category || 'Other') });
    }));
    r.post('/purchases', (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        const me = (0, helpers_1.userId)(req);
        const staff = await staffOf(me);
        const title = String(b.title || '').trim().slice(0, 200);
        if (!title)
            return (0, recordRouter_1.fail)(res, 400, 'Say what you want to buy');
        const items = cleanItems(b.items);
        const total = items.length ? items.reduce((t, i) => t + i.qty * i.unitPrice, 0) : Math.max(0, (0, helpers_1.toNum)(b.total));
        if (!(total > 0))
            return (0, recordRouter_1.fail)(res, 400, 'Enter the cost');
        let departmentId = staff?.departmentId ? Number(staff.departmentId) : null;
        if (b.departmentId) {
            const wanted = Number(b.departmentId);
            const { memberDepartmentIds } = require('./helpers');
            if (canSeeAll(req) || (await memberDepartmentIds(me)).includes(wanted))
                departmentId = wanted;
        }
        if (!departmentId)
            return (0, recordRouter_1.fail)(res, 400, 'Choose which brand this is for');
        const currency = String(b.currency || 'NGN').toUpperCase().slice(0, 3);
        const { toNgn } = require('./fx');
        const conv = await toNgn(total, currency);
        const { EXPENSE_CATEGORIES } = require('./profit');
        const category = EXPENSE_CATEGORIES.includes(b.category) ? b.category : 'Other';
        const heads = (await (0, helpers_1.departmentHeadUserIds)(departmentId)).filter((u) => u !== me);
        const myHeaded = await (0, helpers_1.headedDepartmentIds)(me);
        let status = S.HOD;
        if ((0, helpers_1.isManagement)(req))
            status = S.APPROVED;
        else if (myHeaded.includes(departmentId) || !heads.length)
            status = S.MGMT;
        const row = await models_1.ErpModels.PurchaseRequest.create({
            code: await (0, helpers_1.nextCode)(`${await (0, recordRouter_1.brandPrefix)(departmentId)}-PR`), title, items, category, total, currency, amountNgn: conv.amountNgn,
            vendor: b.vendor ? String(b.vendor).slice(0, 160) : null, reason: b.reason ? String(b.reason).slice(0, 4000) : null,
            neededBy: b.neededBy || null, urgency: b.urgency === 'Urgent' ? 'Urgent' : 'Normal', quoteUrl: b.quoteUrl || null,
            status, requestedById: me, requestedByName: (0, helpers_1.userName)(req), departmentId,
            history: [{ at: new Date().toISOString(), by: (0, helpers_1.userName)(req), byId: me, action: status === S.APPROVED ? 'Requested and approved (management)' : 'Requested', note: null }],
        });
        await (0, helpers_1.audit)(req, 'Purchases', 'Create', 'PurchaseRequest', row.id, `${(0, helpers_1.userName)(req)} requested to buy “${title}” (${row.code})`, { total, currency, category });
        if (status === S.APPROVED) {
            await (0, helpers_1.notifyUsers)(req, await (0, helpers_1.userIdsWithRoles)(['accountant']), { title: 'Purchase approved — ready to buy', message: `${row.code}: “${title}” (${naira(conv.amountNgn ?? total)}).`, type: 'Approval', actionUrl: `/purchases?open=${row.id}` }, { excludeSelf: me });
        }
        else
            await notifyApprovers(req, row);
        (0, helpers_1.emitChange)(req, 'purchase_request', 'created', row);
        return (0, recordRouter_1.ok)(res, row, status === S.APPROVED ? 'Request saved and approved' : 'Request sent for approval', 201);
    }));
    r.post('/purchases/:id(\\d+)/decide', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.PurchaseRequest.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Purchase request not found');
        const p = await permissions(req, row.get({ plain: true }));
        if (!p.canApprove)
            return (0, recordRouter_1.fail)(res, 403, 'You cannot approve this request at this stage');
        const approve = req.body?.decision === 'approve';
        const note = req.body?.note ? String(req.body.note).slice(0, 2000) : null;
        if (!approve) {
            if (!note)
                return (0, recordRouter_1.fail)(res, 400, 'Say why you are turning it down');
            await row.update({ status: S.REJECTED, history: push(row, req, 'Rejected', note) });
            await (0, helpers_1.notifyUsers)(req, [Number(row.requestedById)], { title: 'Purchase request turned down', message: `${row.code} “${row.title}”: ${note}`, type: 'Alert', actionUrl: `/purchases?open=${row.id}` }, { excludeSelf: (0, helpers_1.userId)(req) });
            await (0, helpers_1.audit)(req, 'Purchases', 'Reject', 'PurchaseRequest', row.id, `${(0, helpers_1.userName)(req)} rejected ${row.code}`, { note });
            (0, helpers_1.emitChange)(req, 'purchase_request', 'updated', row);
            return (0, recordRouter_1.ok)(res, row, 'Request turned down');
        }
        let next = S.APPROVED;
        let why = note;
        if (row.status === S.HOD && !(0, helpers_1.isManagement)(req)) {
            const { hodLimit } = await purchaseSettings();
            const amt = Number(row.amountNgn ?? row.total);
            const check = await budgetCheck(row.departmentId, amt, row.category);
            if (amt > hodLimit || check?.over) {
                next = S.MGMT;
                why = [note, amt > hodLimit ? `Above ${naira(hodLimit)}, so management must also approve` : 'Over this month\'s budget, so management must also approve'].filter(Boolean).join(' — ');
            }
        }
        await row.update({ status: next, history: push(row, req, next === S.APPROVED ? 'Approved' : 'Approved by head of department', why) });
        await (0, helpers_1.audit)(req, 'Purchases', 'Approve', 'PurchaseRequest', row.id, `${(0, helpers_1.userName)(req)} approved ${row.code}${next === S.MGMT ? ' (sent to management)' : ''}`);
        if (next === S.MGMT)
            await notifyApprovers(req, row);
        else {
            await (0, helpers_1.notifyUsers)(req, [Number(row.requestedById)], { title: 'Purchase request approved', message: `${row.code} “${row.title}” is approved. Accounts will buy it.`, type: 'Approval', actionUrl: `/purchases?open=${row.id}` }, { excludeSelf: (0, helpers_1.userId)(req) });
            await (0, helpers_1.notifyUsers)(req, await (0, helpers_1.userIdsWithRoles)(['accountant']), { title: 'Purchase approved — ready to buy', message: `${row.code}: “${row.title}” (${naira(row.amountNgn ?? row.total)}).`, type: 'Approval', actionUrl: `/purchases?open=${row.id}` }, { excludeSelf: (0, helpers_1.userId)(req) });
        }
        (0, helpers_1.emitChange)(req, 'purchase_request', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, next === S.APPROVED ? 'Approved' : 'Approved and sent to management');
    }));
    r.post('/purchases/:id(\\d+)/bought', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.PurchaseRequest.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Purchase request not found');
        const p = await permissions(req, row.get({ plain: true }));
        if (!p.canBuy)
            return (0, recordRouter_1.fail)(res, 403, 'Only Accounts or management can record the purchase once it is approved');
        const b = req.body || {};
        const amount = (0, helpers_1.toNum)(b.actualAmount, Number(row.total));
        if (!(amount > 0))
            return (0, recordRouter_1.fail)(res, 400, 'Enter what was paid');
        const paidAt = b.boughtAt || new Date().toISOString().slice(0, 10);
        const { toNgn } = require('./fx');
        const conv = row.currency === 'NGN' ? { amountNgn: amount, fxRate: 1 } : await toNgn(amount, row.currency);
        const expense = await models_1.ErpModels.Expense.create({
            code: await (0, helpers_1.nextCode)(`${await (0, recordRouter_1.brandPrefix)(row.departmentId)}-EXP`), title: row.title, category: row.category,
            vendor: b.vendor || row.vendor || null, amount, currency: row.currency, fxRate: conv.fxRate, amountNgn: conv.amountNgn,
            paidAt, method: b.method || 'Transfer', reference: row.code, receiptUrl: b.receiptUrl || null, status: 'Paid',
            notes: `Purchase request ${row.code} by ${row.requestedByName}`, departmentId: row.departmentId, createdById: (0, helpers_1.userId)(req),
            meta: { purchaseRequestId: Number(row.id) },
        });
        await row.update({
            status: S.BOUGHT, actualAmount: amount, boughtAt: paidAt, receiptUrl: b.receiptUrl || null, vendor: b.vendor || row.vendor,
            expenseId: expense.id, history: push(row, req, 'Bought', `Paid ${row.currency === 'NGN' ? naira(amount) : `${row.currency} ${amount.toLocaleString()}`} — expense ${expense.code}`),
        });
        await (0, helpers_1.audit)(req, 'Purchases', 'Bought', 'PurchaseRequest', row.id, `${(0, helpers_1.userName)(req)} recorded purchase ${row.code} (expense ${expense.code})`, { amount });
        await (0, helpers_1.notifyUsers)(req, [Number(row.requestedById)], { title: 'Your purchase has been bought', message: `${row.code} “${row.title}” has been paid for.`, type: 'System', actionUrl: `/purchases?open=${row.id}` }, { excludeSelf: (0, helpers_1.userId)(req) });
        (0, helpers_1.emitChange)(req, 'purchase_request', 'updated', row);
        (0, helpers_1.emitChange)(req, 'business_expense', 'created', expense);
        return (0, recordRouter_1.ok)(res, { request: row, expense }, 'Purchase recorded as an expense');
    }));
    r.post('/purchases/:id(\\d+)/cancel', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.PurchaseRequest.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Purchase request not found');
        const p = await permissions(req, row.get({ plain: true }));
        if (!p.canCancel)
            return (0, recordRouter_1.fail)(res, 403, 'This request can no longer be cancelled');
        await row.update({ status: S.CANCELLED, history: push(row, req, 'Cancelled', req.body?.note) });
        await (0, helpers_1.audit)(req, 'Purchases', 'Cancel', 'PurchaseRequest', row.id, `${(0, helpers_1.userName)(req)} cancelled ${row.code}`);
        (0, helpers_1.emitChange)(req, 'purchase_request', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Request cancelled');
    }));
    r.delete('/purchases/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only management can delete purchase requests');
        const row = await models_1.ErpModels.PurchaseRequest.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Purchase request not found');
        await row.destroy();
        await (0, helpers_1.audit)(req, 'Purchases', 'Delete', 'PurchaseRequest', row.id, `${(0, helpers_1.userName)(req)} deleted ${row.code}`);
        (0, helpers_1.emitChange)(req, 'purchase_request', 'deleted', { id: row.id });
        return (0, recordRouter_1.ok)(res, { id: row.id }, 'Request deleted');
    }));
    r.put('/purchases/settings', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only management can change approval limits');
        const value = { hodLimit: Math.max(0, (0, helpers_1.toNum)(req.body?.hodLimit, 100000)) };
        await models_1.ErpModels.Setting.upsert({ key: SETTINGS_KEY, value });
        await (0, helpers_1.audit)(req, 'Purchases', 'Update', 'Settings', SETTINGS_KEY, `${(0, helpers_1.userName)(req)} set the head-of-department purchase limit to ${naira(value.hodLimit)}`);
        return (0, recordRouter_1.ok)(res, value, 'Limit saved');
    }));
    r.get('/budgets', (0, recordRouter_1.wrap)(async (req, res) => {
        const headed = await (0, helpers_1.headedDepartmentIds)((0, helpers_1.userId)(req));
        if (!canSeeAll(req) && !headed.length)
            return (0, recordRouter_1.fail)(res, 403, 'Budgets are for management, Accounts and heads of department');
        const now = new Date();
        const year = Number(req.query.year) || now.getFullYear();
        const month = Number(req.query.month) || now.getMonth() + 1;
        const { brandDepartments } = require('./people');
        let brands = await brandDepartments();
        if (!canSeeAll(req))
            brands = brands.filter((b) => headed.includes(b.id));
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
        return (0, recordRouter_1.ok)(res, { year, month, brands: out, canEdit: canSeeAll(req) });
    }));
    r.put('/budgets/:brandId(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!canSeeAll(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only management and Accounts can set budgets');
        const b = req.body || {};
        const now = new Date();
        const year = Number(b.year) || now.getFullYear();
        const month = Math.min(12, Math.max(1, Number(b.month) || now.getMonth() + 1));
        const categories = {};
        for (const [k, v] of Object.entries(b.categories || {}))
            if ((0, helpers_1.toNum)(v) > 0)
                categories[String(k).slice(0, 60)] = (0, helpers_1.toNum)(v);
        const data = { departmentId: Number(req.params.brandId), year, month, amount: Math.max(0, (0, helpers_1.toNum)(b.amount)), categories, notes: b.notes ? String(b.notes).slice(0, 2000) : null, updatedById: (0, helpers_1.userId)(req) };
        const existing = await models_1.ErpModels.Budget.findOne({ where: { departmentId: data.departmentId, year, month } });
        if (existing)
            await existing.update(data);
        else
            await models_1.ErpModels.Budget.create(data);
        await (0, helpers_1.audit)(req, 'Budgets', existing ? 'Update' : 'Create', 'Budget', data.departmentId, `${(0, helpers_1.userName)(req)} set the ${year}-${String(month).padStart(2, '0')} budget to ${naira(data.amount)}`, data);
        (0, helpers_1.emitChange)(req, 'budget', 'updated', { id: data.departmentId });
        return (0, recordRouter_1.ok)(res, data, 'Budget saved');
    }));
    return r;
}
//# sourceMappingURL=procurement.js.map