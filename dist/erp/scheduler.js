"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastFriday = lastFriday;
exports.buildWeeklySummary = buildWeeklySummary;
exports.startErpScheduler = startErpScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
const helpers_1 = require("./helpers");
const outbound_1 = require("./outbound");
const TZ = process.env.ERP_TIMEZONE || 'Africa/Lagos';
const q = (sql, replacements = {}) => Database_1.default.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
function lastFriday(from = new Date()) {
    const d = new Date(from);
    const diff = (d.getDay() + 2) % 7 || 7;
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
}
async function staffWithoutReport(weekEnding) {
    return q(`SELECT s.id, s."userId", s."firstName", s."lastName", s."departmentId" FROM staff s
     JOIN users u ON u.id = s."userId" AND u."deletedAt" IS NULL
     WHERE s."deletedAt" IS NULL AND COALESCE(s.status, 'Active') = 'Active' AND s."userId" IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM weekly_reports w WHERE w."staffId" = s.id AND w."weekEnding" = :we AND w."deletedAt" IS NULL)
       AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur."roleId" WHERE ur."userId" = s."userId" AND ur."deletedAt" IS NULL AND LOWER(r.code) IN ('superadmin','student'))`, { we: weekEnding });
}
async function buildWeeklySummary(weekStart) {
    const end = weekStart ? new Date(weekStart.getTime() + 7 * 86400000) : new Date();
    const start = weekStart || new Date(end.getTime() - 7 * 86400000);
    const R = { s: start, e: end };
    const brands = await q(`SELECT bp.code, bp."displayName", bp."departmentId" FROM erp_brand_profiles bp ORDER BY bp.id`);
    const fam = async (d) => (await q(`SELECT id FROM departments WHERE id = :d OR "parentDepartmentId" = :d`, { d })).map((r) => Number(r.id));
    const count = async (table, ids, extra = '') => Number((await q(`SELECT COUNT(*) n FROM ${table} WHERE "departmentId" IN (:ids) AND "createdAt" >= :s AND "createdAt" < :e ${extra}`, { ids, ...R }))[0].n);
    const perBrand = [];
    for (const b of brands) {
        const ids = await fam(Number(b.departmentId));
        const payments = await q(`SELECT currency, SUM(amount) total, COUNT(*) n FROM erp_payments WHERE "departmentId" IN (:ids) AND status = 'Completed' AND "paidAt" >= :s AND "paidAt" < :e GROUP BY currency`, { ids, ...R });
        perBrand.push({
            code: b.code, name: b.displayName,
            newRecords: {
                travelCases: await count('erp_travel_cases', ids), bookings: await count('erp_travel_bookings', ids),
                techProjects: await count('erp_tech_projects', ids), tickets: await count('erp_support_tickets', ids),
                customOrders: await count('erp_custom_orders', ids), exportOrders: await count('erp_export_orders', ids),
            },
            payments: payments.map((p) => ({ currency: p.currency, total: Number(p.total), count: Number(p.n) })),
            openTickets: Number((await q(`SELECT COUNT(*) n FROM erp_support_tickets WHERE "departmentId" IN (:ids) AND status NOT IN ('Resolved','Closed')`, { ids }))[0].n),
            overdueTickets: Number((await q(`SELECT COUNT(*) n FROM erp_support_tickets WHERE "departmentId" IN (:ids) AND status NOT IN ('Resolved','Closed') AND "slaDueAt" < NOW()`, { ids }))[0].n),
            renewalsNext30: Number((await q(`SELECT COUNT(*) n FROM erp_service_subscriptions WHERE "departmentId" IN (:ids) AND status <> 'Cancelled' AND "renewalDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + 30`, { ids }))[0].n),
            documentsSigned: Number((await q(`SELECT COUNT(*) n FROM erp_signature_requests WHERE "departmentId" IN (:ids) AND status IN ('Signed','Acknowledged') AND "signedAt" >= :s AND "signedAt" < :e`, { ids, ...R }))[0].n),
            documentsPending: Number((await q(`SELECT COUNT(*) n FROM erp_signature_requests WHERE "departmentId" IN (:ids) AND status IN ('Sent','Viewed')`, { ids }))[0].n),
        });
    }
    const weekEnding = lastFriday(end);
    const missing = await staffWithoutReport(weekEnding);
    const totalStaff = Number((await q(`SELECT COUNT(*) n FROM staff s WHERE s."deletedAt" IS NULL AND s."userId" IS NOT NULL AND COALESCE(s.status,'Active') = 'Active'
       AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur."roleId" WHERE ur."userId" = s."userId" AND ur."deletedAt" IS NULL AND LOWER(r.code) IN ('superadmin','student'))`))[0].n);
    const hr = {
        weekEnding,
        weeklyReportsMissing: missing.map((m) => `${m.firstName} ${m.lastName}`.trim()),
        weeklyReportsSubmitted: Math.max(totalStaff - missing.length, 0),
        pendingLeave: Number((await q(`SELECT COUNT(*) n FROM leave_requests WHERE status = 'Pending' AND "deletedAt" IS NULL`).catch(() => [{ n: 0 }]))[0].n),
        newApplicants: Number((await q(`SELECT COUNT(*) n FROM job_applications WHERE "createdAt" >= :s AND "createdAt" < :e`, R).catch(() => [{ n: 0 }]))[0].n),
    };
    return { period: { start, end }, brands: perBrand, hr };
}
function summaryHtml(s) {
    const money = (arr) => arr.length ? arr.map((p) => `${p.currency} ${p.total.toLocaleString()}`).join(', ') : '—';
    const rows = s.brands.map((b) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee"><strong>${(0, outbound_1.escapeHtml)(b.name)}</strong></td>
<td style="padding:6px 8px;border-bottom:1px solid #eee">${Object.values(b.newRecords).reduce((a, n) => a + n, 0)}</td>
<td style="padding:6px 8px;border-bottom:1px solid #eee">${money(b.payments)}</td>
<td style="padding:6px 8px;border-bottom:1px solid #eee">${b.openTickets}${b.overdueTickets ? ` (${b.overdueTickets} overdue)` : ''}</td>
<td style="padding:6px 8px;border-bottom:1px solid #eee">${b.documentsPending}</td></tr>`).join('');
    return `<p>Here is last week's summary (${new Date(s.period.start).toDateString()} – ${new Date(s.period.end).toDateString()}).</p>
<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="background:#f3f4f6"><th align="left" style="padding:6px 8px">Brand</th><th align="left" style="padding:6px 8px">New records</th><th align="left" style="padding:6px 8px">Payments</th><th align="left" style="padding:6px 8px">Open tickets</th><th align="left" style="padding:6px 8px">Docs awaiting signature</th></tr>${rows}</table>
<p><strong>Weekly reports:</strong> ${s.hr.weeklyReportsSubmitted} submitted, ${s.hr.weeklyReportsMissing.length} missing${s.hr.weeklyReportsMissing.length ? ` (${(0, outbound_1.escapeHtml)(s.hr.weeklyReportsMissing.slice(0, 25).join(', '))})` : ''}.<br/>
<strong>Pending leave:</strong> ${s.hr.pendingLeave} · <strong>New job applicants:</strong> ${s.hr.newApplicants}</p>`;
}
async function safe(name, fn) {
    try {
        await fn();
    }
    catch (e) {
        console.error(`[ERP scheduler] ${name} failed:`, e.message);
    }
}
function startErpScheduler() {
    if (process.env.ERP_SCHEDULER === 'off')
        return;
    const opts = { timezone: TZ };
    node_cron_1.default.schedule('15 7 * * *', () => safe('morning-reminders', async () => {
        await require('./agenda').runMorningReminders();
    }), opts);
    node_cron_1.default.schedule('30 6 1 * *', () => safe('recurring-expenses', async () => {
        const rows = await q(`SELECT * FROM erp_expenses e WHERE e.recurring = 'Monthly' AND e.status <> 'Cancelled'
      AND e."paidAt" >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND e."paidAt" < date_trunc('month', CURRENT_DATE)
      AND NOT EXISTS (SELECT 1 FROM erp_expenses x WHERE x.meta->>'repeatOf' = e.id::text AND x."paidAt" >= date_trunc('month', CURRENT_DATE))`);
        const { nextCode } = require('./helpers');
        const { brandPrefix } = require('./recordRouter');
        const { ErpModels } = require('./models');
        for (const e of rows) {
            await ErpModels.Expense.create({
                code: await nextCode(`${await brandPrefix(e.departmentId)}-EXP`), title: e.title, category: e.category, vendor: e.vendor,
                amount: e.amount, currency: e.currency, fxRate: e.fxRate, amountNgn: e.amountNgn, method: e.method, recurring: 'Monthly',
                paidAt: new Date().toISOString().slice(0, 8) + String(Math.min(28, new Date(e.paidAt).getDate())).padStart(2, '0'),
                notes: e.notes, departmentId: e.departmentId, createdById: e.createdById, meta: { repeatOf: String(e.id) },
            });
        }
    }), opts);
    node_cron_1.default.schedule('0 7 * * *', () => safe('birthdays', async () => { await require('./birthdays').runBirthdays(); }), opts);
    node_cron_1.default.schedule('0 6 * * *', () => safe('fx-refresh', async () => {
        const fx = require('./fx');
        await fx.refreshMarketRates();
        await fx.backfillPaymentNgn();
    }), opts);
    node_cron_1.default.schedule('30 7 * * 1', () => safe('weekly-report-reminder', async () => {
        const we = lastFriday();
        const missing = await staffWithoutReport(we);
        await (0, helpers_1.notifyUsers)(null, missing.map((m) => Number(m.userId)), {
            title: 'Weekly report due this morning', type: 'Alert', priority: 'High', actionUrl: '/hr/weekly-report',
            message: `Please submit your weekly report for the week ending ${we} before 12:00 noon today.`,
        });
    }), opts);
    node_cron_1.default.schedule('0 8 * * 1', () => safe('weekly-summary', async () => {
        const summary = await buildWeeklySummary();
        const ids = await (0, helpers_1.userIdsWithRoles)(['superadmin', 'admin']);
        await (0, helpers_1.notifyUsers)(null, ids, { title: 'Weekly business summary is ready', message: 'Last week across all brands — open Reports to view and print.', actionUrl: '/reports/weekly' });
        const users = await q(`SELECT email FROM users WHERE id IN (:ids) AND "deletedAt" IS NULL`, { ids: ids.length ? ids : [0] });
        const brand = await (0, outbound_1.brandForDepartment)(null);
        for (const u of users)
            await (0, outbound_1.sendBrandEmail)(brand, u.email, 'MaxHub weekly business summary', (0, outbound_1.brandEmailHtml)(brand, 'Weekly business summary', summaryHtml(summary)));
    }), opts);
    node_cron_1.default.schedule('0 12 * * 1', () => safe('weekly-report-escalation', async () => {
        const we = lastFriday();
        const missing = await staffWithoutReport(we);
        if (!missing.length)
            return;
        const byDept = new Map();
        for (const m of missing) {
            const k = Number(m.departmentId || 0);
            byDept.set(k, [...(byDept.get(k) || []), `${m.firstName} ${m.lastName}`.trim()]);
        }
        for (const [dept, names] of byDept) {
            const heads = await (0, helpers_1.departmentHeadUserIds)(dept);
            await (0, helpers_1.notifyUsers)(null, heads, { title: 'Weekly reports still missing', type: 'Alert', message: `${names.length} in your department have not submitted for ${we}: ${names.join(', ')}`, actionUrl: '/hr/weekly-report' });
        }
        const admins = await (0, helpers_1.userIdsWithRoles)(['admin', 'hr']);
        await (0, helpers_1.notifyUsers)(null, admins, { title: 'Weekly reports still missing', type: 'Alert', message: `${missing.length} staff have not submitted for ${we}.`, actionUrl: '/hr/weekly-report' });
    }), opts);
    node_cron_1.default.schedule('15 8 * * *', () => safe('renewals', async () => {
        await Database_1.default.query(`UPDATE erp_service_subscriptions SET status = 'Expired', "updatedAt" = NOW() WHERE status IN ('Active','Expiring') AND "renewalDate" < CURRENT_DATE AND NOT "autoRenew"`);
        await Database_1.default.query(`UPDATE erp_service_subscriptions SET status = 'Expiring', "updatedAt" = NOW() WHERE status = 'Active' AND "renewalDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + 30`);
        const due = await q(`SELECT *, ("renewalDate" - CURRENT_DATE) AS days FROM erp_service_subscriptions WHERE status <> 'Cancelled' AND ("renewalDate" - CURRENT_DATE) IN (30, 7, 1, 0)`);
        for (const s of due) {
            if (Number(s.lastReminderDays) === Number(s.days))
                continue;
            const to = [Number(s.assignedToUserId), Number(s.createdById), ...(await (0, helpers_1.departmentHeadUserIds)(s.departmentId))];
            await (0, helpers_1.notifyUsers)(null, to, { title: `Renewal in ${s.days} day(s): ${s.name}`, type: 'Alert', priority: Number(s.days) <= 1 ? 'Urgent' : 'High', message: `${s.serviceType} for ${s.customerName} renews on ${s.renewalDate}.`, actionUrl: '/kurios/solutions?tab=renewals' });
            await Database_1.default.query(`UPDATE erp_service_subscriptions SET "lastReminderDays" = :d WHERE id = :id`, { replacements: { d: s.days, id: s.id } });
        }
    }), opts);
    node_cron_1.default.schedule('30 8 * * 1-5', () => safe('passport-expiry', async () => {
        const rows = await q(`SELECT id, code, "customerName", "passportExpiry", "travelDate", "assignedToUserId", "createdById", "departmentId", meta FROM erp_travel_cases
      WHERE stage NOT IN ('Closed','Rejected','Travelled') AND "passportExpiry" IS NOT NULL
        AND "passportExpiry" < COALESCE("travelDate", CURRENT_DATE) + INTERVAL '6 months' AND COALESCE((meta->>'passportWarned')::boolean, false) = false`);
        for (const c of rows) {
            await (0, helpers_1.notifyUsers)(null, [Number(c.assignedToUserId), Number(c.createdById)], { title: `Passport expiring: ${c.customerName}`, type: 'Alert', priority: 'High', message: `${c.code}: passport expires ${c.passportExpiry} — most embassies need 6 months validity.`, actionUrl: `/visamax/cases?open=${c.id}` });
            await Database_1.default.query(`UPDATE erp_travel_cases SET meta = COALESCE(meta, '{}'::jsonb) || '{"passportWarned": true}'::jsonb WHERE id = :id`, { replacements: { id: c.id } });
        }
    }), opts);
    node_cron_1.default.schedule('0 9 * * *', () => safe('documents', async () => {
        await Database_1.default.query(`UPDATE erp_signature_requests SET status = 'Expired', "updatedAt" = NOW() WHERE status IN ('Sent','Viewed') AND "expiresAt" < NOW()`);
        const stale = await q(`SELECT id, code, title, "recipientName", "sentById" FROM erp_signature_requests WHERE status IN ('Sent','Viewed') AND "sentAt" < NOW() - INTERVAL '3 days' AND "lastReminderAt" IS NULL`);
        for (const s of stale) {
            await (0, helpers_1.notifyUsers)(null, [Number(s.sentById)], { title: 'Document still unsigned', message: `${s.recipientName} has not signed "${s.title}" (${s.code}) after 3 days. Consider sending a reminder.`, actionUrl: `/documents?request=${s.id}` });
            await Database_1.default.query(`UPDATE erp_signature_requests SET "lastReminderAt" = NOW() WHERE id = :id`, { replacements: { id: s.id } });
        }
    }), opts);
    node_cron_1.default.schedule('*/30 * * * *', () => safe('ticket-sla', async () => {
        const rows = await q(`SELECT id, code, subject, "assignedToUserId", "departmentId" FROM erp_support_tickets WHERE status NOT IN ('Resolved','Closed') AND "slaDueAt" < NOW() AND COALESCE((meta->>'slaNotified')::boolean, false) = false`);
        for (const t of rows) {
            await (0, helpers_1.notifyUsers)(null, [Number(t.assignedToUserId), ...(await (0, helpers_1.departmentHeadUserIds)(t.departmentId))], { title: `SLA breached: ${t.code}`, type: 'Alert', priority: 'Urgent', message: t.subject, actionUrl: `/kurios/solutions?tab=tickets&open=${t.id}` });
            await Database_1.default.query(`UPDATE erp_support_tickets SET meta = COALESCE(meta, '{}'::jsonb) || '{"slaNotified": true}'::jsonb WHERE id = :id`, { replacements: { id: t.id } });
        }
    }), opts);
    console.log(`✅ ERP scheduler started (${TZ})`);
}
//# sourceMappingURL=scheduler.js.map