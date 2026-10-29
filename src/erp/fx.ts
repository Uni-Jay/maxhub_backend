import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import { ErpModels } from './models';
import { wrap, ok, fail } from './recordRouter';
import { audit, db, isManagement, roleOf, toNum, userName } from './helpers';

/**
 * Currency conversion. Rates are stored as "naira per 1 unit" of each
 * currency (e.g. USD → 1,550). Market rates refresh daily; Accounts can
 * set their own rate for any currency, which then wins.
 */

export const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AED', 'GHS', 'ZAR', 'CNY', 'KES'];
const KEY = 'fxRates';

export interface FxState {
  market: Record<string, number>;   // NGN per unit, from the feed
  manual: Record<string, number>;   // NGN per unit, set by Accounts
  updatedAt: string | null;
  manualUpdatedAt?: string | null;
  manualBy?: string | null;
  source?: string;
}

const EMPTY: FxState = { market: {}, manual: {}, updatedAt: null, source: 'none' };

export async function fxState(): Promise<FxState> {
  const row: any = await ErpModels.Setting?.findByPk(KEY, { raw: true }).catch(() => null);
  return { ...EMPTY, ...(row?.value || {}) };
}

/** NGN per 1 unit of currency — manual rate first, then market. */
export async function rateToNgn(currency?: string | null): Promise<number | null> {
  const c = String(currency || 'NGN').toUpperCase();
  if (c === 'NGN') return 1;
  const s = await fxState();
  const r = Number(s.manual?.[c] || s.market?.[c] || 0);
  return r > 0 ? r : null;
}

export async function toNgn(amount: any, currency?: string | null): Promise<{ amountNgn: number | null; fxRate: number | null }> {
  const rate = await rateToNgn(currency);
  if (!rate) return { amountNgn: null, fxRate: null };
  return { amountNgn: Math.round(Number(amount || 0) * rate * 100) / 100, fxRate: rate };
}

/** Pulls today's market rates (free feed, no key). */
export async function refreshMarketRates(): Promise<FxState> {
  const s = await fxState();
  const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Rate feed answered ${res.status}`);
  const body: any = await res.json();
  if (body?.result !== 'success' || !body?.rates) throw new Error('Rate feed returned no rates');
  const ngnPerUsd = Number(body.rates.NGN);
  if (!(ngnPerUsd > 0)) throw new Error('Rate feed has no naira rate');
  const market: Record<string, number> = {};
  for (const c of CURRENCIES) {
    if (c === 'NGN') continue;
    const perUsd = Number(body.rates[c]);
    if (perUsd > 0) market[c] = Math.round((ngnPerUsd / perUsd) * 10000) / 10000; // naira per 1 unit of c
  }
  const next: FxState = { ...s, market, updatedAt: new Date().toISOString(), source: 'open.er-api.com' };
  await ErpModels.Setting.upsert({ key: KEY, value: next } as any);
  return next;
}

/** Fills in the naira value of any foreign payment that does not have one yet. */
export async function backfillPaymentNgn(table: 'erp_payments' | 'erp_expenses' = 'erp_payments'): Promise<number> {
  const rows: any[] = await db.query(
    `SELECT id, amount, currency FROM ${table} WHERE "amountNgn" IS NULL`, { type: QueryTypes.SELECT },
  ).catch(() => []);
  let n = 0;
  for (const r of rows) {
    const { amountNgn, fxRate } = await toNgn(r.amount, r.currency);
    if (amountNgn === null) continue;
    await db.query(`UPDATE ${table} SET "amountNgn" = :a, "fxRate" = :r WHERE id = :id`, { replacements: { a: amountNgn, r: fxRate, id: r.id } });
    n++;
  }
  return n;
}

const canManage = (req: any) => isManagement(req) || roleOf(req) === 'accountant';
const canView = (req: any) => canManage(req) || roleOf(req) === 'hr';

export function fxRouter(): Router {
  const r = Router();

  r.get('/fx', wrap(async (req, res) => {
    let s = await fxState();
    if (!s.updatedAt || Date.now() - new Date(s.updatedAt).getTime() > 24 * 3600_000) {
      s = await refreshMarketRates().catch(() => s);
    }
    const rates = CURRENCIES.filter((c) => c !== 'NGN').map((c) => ({
      currency: c, market: s.market?.[c] ?? null, manual: s.manual?.[c] ?? null,
      rate: s.manual?.[c] || s.market?.[c] || null,
    }));
    let balances: any[] = [];
    let recent: any[] = [];
    if (canView(req)) {
      const rows: any[] = await db.query(
        `SELECT currency, COUNT(*)::int AS n, COALESCE(SUM(amount),0) AS total, COALESCE(SUM("amountNgn"),0) AS "totalNgn",
                COALESCE(SUM(amount) FILTER (WHERE "paidAt" >= date_trunc('month', NOW())),0) AS "thisMonth"
         FROM erp_payments WHERE status = 'Completed' GROUP BY currency ORDER BY currency`, { type: QueryTypes.SELECT },
      );
      balances = rows.map((b) => {
        const rate = b.currency === 'NGN' ? 1 : (s.manual?.[b.currency] || s.market?.[b.currency] || null);
        return {
          currency: b.currency, count: b.n, total: Number(b.total), thisMonth: Number(b.thisMonth),
          ngnWhenReceived: Number(b.totalNgn), ngnToday: rate ? Math.round(Number(b.total) * rate * 100) / 100 : null,
        };
      });
      recent = await db.query(
        `SELECT p.id, p."receiptNo", p."customerName", p.amount, p.currency, p."fxRate", p."amountNgn", p."paidAt", p.method, bp."displayName" AS brand
         FROM erp_payments p LEFT JOIN departments d ON d.id = p."departmentId"
         LEFT JOIN erp_brand_profiles bp ON bp."departmentId" = COALESCE(d."parentDepartmentId", d.id)
         WHERE p.status = 'Completed' AND p.currency <> 'NGN' ORDER BY p."paidAt" DESC LIMIT 30`, { type: QueryTypes.SELECT },
      );
    }
    return ok(res, { rates, updatedAt: s.updatedAt, manualUpdatedAt: s.manualUpdatedAt, manualBy: s.manualBy, source: s.source, balances, recent, canManage: canManage(req) });
  }));

  r.get('/fx/convert', wrap(async (req, res) => {
    const amount = toNum(req.query.amount);
    const from = String(req.query.from || 'USD').toUpperCase();
    const to = String(req.query.to || 'NGN').toUpperCase();
    const a = await rateToNgn(from); const b = await rateToNgn(to);
    if (!a || !b) return fail(res, 400, 'No rate for that currency yet');
    return ok(res, { amount, from, to, result: Math.round((amount * a / b) * 100) / 100, rate: a / b });
  }));

  /** Accounts set their own rates. Body: { rates: { USD: 1550, GBP: null } } (null clears). */
  r.put('/fx', wrap(async (req, res) => {
    if (!canManage(req)) return fail(res, 403, 'Only Accounts and management can set exchange rates');
    const s = await fxState();
    const manual = { ...(s.manual || {}) };
    for (const [c, v] of Object.entries(req.body?.rates || {})) {
      const code = String(c).toUpperCase();
      if (!CURRENCIES.includes(code) || code === 'NGN') continue;
      const n = Number(v);
      if (v === null || v === '' || !(n > 0)) delete manual[code]; else manual[code] = Math.round(n * 10000) / 10000;
    }
    const next = { ...s, manual, manualUpdatedAt: new Date().toISOString(), manualBy: userName(req) };
    await ErpModels.Setting.upsert({ key: KEY, value: next } as any);
    await audit(req, 'Finance', 'Update', 'ExchangeRates', 0, `${userName(req)} set exchange rates`, manual);
    await backfillPaymentNgn();
    return ok(res, next, 'Rates saved');
  }));

  r.post('/fx/refresh', wrap(async (req, res) => {
    if (!canManage(req)) return fail(res, 403, 'Only Accounts and management can refresh rates');
    try {
      const s = await refreshMarketRates();
      const filled = await backfillPaymentNgn();
      return ok(res, { ...s, filled }, 'Market rates updated');
    } catch (e: any) {
      return fail(res, 502, `Could not reach the rate service: ${e.message}`);
    }
  }));

  return r;
}
