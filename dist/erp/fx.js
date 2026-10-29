"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCIES = void 0;
exports.fxState = fxState;
exports.rateToNgn = rateToNgn;
exports.toNgn = toNgn;
exports.refreshMarketRates = refreshMarketRates;
exports.backfillPaymentNgn = backfillPaymentNgn;
exports.fxRouter = fxRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
exports.CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AED', 'GHS', 'ZAR', 'CNY', 'KES'];
const KEY = 'fxRates';
const EMPTY = { market: {}, manual: {}, updatedAt: null, source: 'none' };
async function fxState() {
    const row = await models_1.ErpModels.Setting?.findByPk(KEY, { raw: true }).catch(() => null);
    return { ...EMPTY, ...(row?.value || {}) };
}
async function rateToNgn(currency) {
    const c = String(currency || 'NGN').toUpperCase();
    if (c === 'NGN')
        return 1;
    const s = await fxState();
    const r = Number(s.manual?.[c] || s.market?.[c] || 0);
    return r > 0 ? r : null;
}
async function toNgn(amount, currency) {
    const rate = await rateToNgn(currency);
    if (!rate)
        return { amountNgn: null, fxRate: null };
    return { amountNgn: Math.round(Number(amount || 0) * rate * 100) / 100, fxRate: rate };
}
async function refreshMarketRates() {
    const s = await fxState();
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(15000) });
    if (!res.ok)
        throw new Error(`Rate feed answered ${res.status}`);
    const body = await res.json();
    if (body?.result !== 'success' || !body?.rates)
        throw new Error('Rate feed returned no rates');
    const ngnPerUsd = Number(body.rates.NGN);
    if (!(ngnPerUsd > 0))
        throw new Error('Rate feed has no naira rate');
    const market = {};
    for (const c of exports.CURRENCIES) {
        if (c === 'NGN')
            continue;
        const perUsd = Number(body.rates[c]);
        if (perUsd > 0)
            market[c] = Math.round((ngnPerUsd / perUsd) * 10000) / 10000;
    }
    const next = { ...s, market, updatedAt: new Date().toISOString(), source: 'open.er-api.com' };
    await models_1.ErpModels.Setting.upsert({ key: KEY, value: next });
    return next;
}
async function backfillPaymentNgn(table = 'erp_payments') {
    const rows = await helpers_1.db.query(`SELECT id, amount, currency FROM ${table} WHERE "amountNgn" IS NULL`, { type: sequelize_1.QueryTypes.SELECT }).catch(() => []);
    let n = 0;
    for (const r of rows) {
        const { amountNgn, fxRate } = await toNgn(r.amount, r.currency);
        if (amountNgn === null)
            continue;
        await helpers_1.db.query(`UPDATE ${table} SET "amountNgn" = :a, "fxRate" = :r WHERE id = :id`, { replacements: { a: amountNgn, r: fxRate, id: r.id } });
        n++;
    }
    return n;
}
const canManage = (req) => (0, helpers_1.isManagement)(req) || (0, helpers_1.roleOf)(req) === 'accountant';
const canView = (req) => canManage(req) || (0, helpers_1.roleOf)(req) === 'hr';
function fxRouter() {
    const r = (0, express_1.Router)();
    r.get('/fx', (0, recordRouter_1.wrap)(async (req, res) => {
        let s = await fxState();
        if (!s.updatedAt || Date.now() - new Date(s.updatedAt).getTime() > 24 * 3600000) {
            s = await refreshMarketRates().catch(() => s);
        }
        const rates = exports.CURRENCIES.filter((c) => c !== 'NGN').map((c) => ({
            currency: c, market: s.market?.[c] ?? null, manual: s.manual?.[c] ?? null,
            rate: s.manual?.[c] || s.market?.[c] || null,
        }));
        let balances = [];
        let recent = [];
        if (canView(req)) {
            const rows = await helpers_1.db.query(`SELECT currency, COUNT(*)::int AS n, COALESCE(SUM(amount),0) AS total, COALESCE(SUM("amountNgn"),0) AS "totalNgn",
                COALESCE(SUM(amount) FILTER (WHERE "paidAt" >= date_trunc('month', NOW())),0) AS "thisMonth"
         FROM erp_payments WHERE status = 'Completed' GROUP BY currency ORDER BY currency`, { type: sequelize_1.QueryTypes.SELECT });
            balances = rows.map((b) => {
                const rate = b.currency === 'NGN' ? 1 : (s.manual?.[b.currency] || s.market?.[b.currency] || null);
                return {
                    currency: b.currency, count: b.n, total: Number(b.total), thisMonth: Number(b.thisMonth),
                    ngnWhenReceived: Number(b.totalNgn), ngnToday: rate ? Math.round(Number(b.total) * rate * 100) / 100 : null,
                };
            });
            recent = await helpers_1.db.query(`SELECT p.id, p."receiptNo", p."customerName", p.amount, p.currency, p."fxRate", p."amountNgn", p."paidAt", p.method, bp."displayName" AS brand
         FROM erp_payments p LEFT JOIN departments d ON d.id = p."departmentId"
         LEFT JOIN erp_brand_profiles bp ON bp."departmentId" = COALESCE(d."parentDepartmentId", d.id)
         WHERE p.status = 'Completed' AND p.currency <> 'NGN' ORDER BY p."paidAt" DESC LIMIT 30`, { type: sequelize_1.QueryTypes.SELECT });
        }
        return (0, recordRouter_1.ok)(res, { rates, updatedAt: s.updatedAt, manualUpdatedAt: s.manualUpdatedAt, manualBy: s.manualBy, source: s.source, balances, recent, canManage: canManage(req) });
    }));
    r.get('/fx/convert', (0, recordRouter_1.wrap)(async (req, res) => {
        const amount = (0, helpers_1.toNum)(req.query.amount);
        const from = String(req.query.from || 'USD').toUpperCase();
        const to = String(req.query.to || 'NGN').toUpperCase();
        const a = await rateToNgn(from);
        const b = await rateToNgn(to);
        if (!a || !b)
            return (0, recordRouter_1.fail)(res, 400, 'No rate for that currency yet');
        return (0, recordRouter_1.ok)(res, { amount, from, to, result: Math.round((amount * a / b) * 100) / 100, rate: a / b });
    }));
    r.put('/fx', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!canManage(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only Accounts and management can set exchange rates');
        const s = await fxState();
        const manual = { ...(s.manual || {}) };
        for (const [c, v] of Object.entries(req.body?.rates || {})) {
            const code = String(c).toUpperCase();
            if (!exports.CURRENCIES.includes(code) || code === 'NGN')
                continue;
            const n = Number(v);
            if (v === null || v === '' || !(n > 0))
                delete manual[code];
            else
                manual[code] = Math.round(n * 10000) / 10000;
        }
        const next = { ...s, manual, manualUpdatedAt: new Date().toISOString(), manualBy: (0, helpers_1.userName)(req) };
        await models_1.ErpModels.Setting.upsert({ key: KEY, value: next });
        await (0, helpers_1.audit)(req, 'Finance', 'Update', 'ExchangeRates', 0, `${(0, helpers_1.userName)(req)} set exchange rates`, manual);
        await backfillPaymentNgn();
        return (0, recordRouter_1.ok)(res, next, 'Rates saved');
    }));
    r.post('/fx/refresh', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!canManage(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only Accounts and management can refresh rates');
        try {
            const s = await refreshMarketRates();
            const filled = await backfillPaymentNgn();
            return (0, recordRouter_1.ok)(res, { ...s, filled }, 'Market rates updated');
        }
        catch (e) {
            return (0, recordRouter_1.fail)(res, 502, `Could not reach the rate service: ${e.message}`);
        }
    }));
    return r;
}
//# sourceMappingURL=fx.js.map