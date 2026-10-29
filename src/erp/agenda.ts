import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import { wrap, ok, fail } from './recordRouter';
import { db, departmentHeadUserIds, notifyUsers, resolveDepartmentId, departmentFamily, audit, userName, isManagement, roleOf } from './helpers';
import { brandEmailHtml, brandForDepartment, escapeHtml, sendBrandEmail } from './outbound';

/**
 * What needs attention in each brand: dated work coming up (appointments,
 * flights, deliveries, renewals, best-before dates…) and anything overdue.
 * Also: morning reminders to the people responsible, a few automatic
 * customer reminders, and outstanding school fees.
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }).catch((e) => { console.error('[agenda]', e.message); return []; }) as Promise<any[]>;

export interface AgendaItem {
  brand: string; kind: string; title: string; detail?: string; date: string; overdue: boolean;
  url: string; ownerUserId?: number | null; departmentId?: number | null;
}

const TZ = process.env.ERP_TIMEZONE || 'Africa/Lagos';
/** Calendar date in Lagos time (DATE columns arrive as 'YYYY-MM-DD' already). */
const day = (d: any) => (!d ? '' : typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }));
const lagosToday = (offsetDays = 0) => new Date(Date.now() + offsetDays * 86400_000).toLocaleDateString('en-CA', { timeZone: TZ });

async function fam(code: string): Promise<number[]> {
  const id = await resolveDepartmentId(code);
  return id ? departmentFamily(id) : [];
}

export async function brandAgenda(brand: string, days = 14): Promise<AgendaItem[]> {
  const ids = await fam(brand);
  if (!ids.length) return [];
  const today = lagosToday();
  const R = { ids, d: days };
  const items: AgendaItem[] = [];
  const push = (rows: any[], f: (r: any) => Omit<AgendaItem, 'brand' | 'overdue'>) => {
    for (const r of rows) { const it = f(r); if (it.date) items.push({ ...it, brand, overdue: it.date < today }); }
  };
  const within = (col: string, back = 30) => `"${col}" BETWEEN CURRENT_DATE - ${back} AND CURRENT_DATE + :d`;

  if (brand === 'VM') {
    const open = `stage NOT IN ('Approved','Rejected','Travelled','Closed')`;
    push(await q(`SELECT id, code, "customerName", "appointmentDate" AS dt, "destinationCountry", "assignedToUserId", "departmentId" FROM erp_travel_cases WHERE "departmentId" IN (:ids) AND ${open} AND ${within('appointmentDate', 7)}`, R),
      (r) => ({ kind: 'Embassy appointment', title: r.customerName, detail: `${r.code}${r.destinationCountry ? ` · ${r.destinationCountry}` : ''}`, date: day(r.dt), url: `/visamax/cases?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, "customerName", "biometricsDate" AS dt, "assignedToUserId", "departmentId" FROM erp_travel_cases WHERE "departmentId" IN (:ids) AND ${open} AND ${within('biometricsDate', 7)}`, R),
      (r) => ({ kind: 'Biometrics', title: r.customerName, detail: r.code, date: day(r.dt), url: `/visamax/cases?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, "customerName", "decisionDate" AS dt, "assignedToUserId", "departmentId" FROM erp_travel_cases WHERE "departmentId" IN (:ids) AND stage = 'Awaiting Decision' AND ${within('decisionDate', 30)}`, R),
      (r) => ({ kind: 'Visa decision expected', title: r.customerName, detail: r.code, date: day(r.dt), url: `/visamax/cases?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, "customerName", "travelDate" AS dt, "destinationCountry", "assignedToUserId", "departmentId" FROM erp_travel_cases WHERE "departmentId" IN (:ids) AND stage NOT IN ('Rejected','Travelled','Closed') AND "travelDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + :d`, R),
      (r) => ({ kind: 'Customer travels', title: r.customerName, detail: `${r.code}${r.destinationCountry ? ` → ${r.destinationCountry}` : ''}`, date: day(r.dt), url: `/visamax/cases?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, "customerName", "departAt" AS dt, destination, "bookingType", "assignedToUserId", "departmentId" FROM erp_travel_bookings WHERE "departmentId" IN (:ids) AND status NOT IN ('Cancelled','Completed') AND "departAt" BETWEEN CURRENT_DATE AND CURRENT_DATE + :d`, R),
      (r) => ({ kind: `${r.bookingType || 'Booking'} departs`, title: r.customerName, detail: `${r.code}${r.destination ? ` → ${r.destination}` : ''}`, date: day(r.dt), url: `/visamax/bookings?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, "customerName", "passportExpiry" AS dt, "assignedToUserId", "departmentId" FROM erp_travel_cases WHERE "departmentId" IN (:ids) AND stage NOT IN ('Rejected','Travelled','Closed') AND "passportExpiry" < CURRENT_DATE + INTERVAL '6 months' AND "passportExpiry" >= CURRENT_DATE - 365`, R),
      (r) => ({ kind: 'Passport expires', title: r.customerName, detail: `${r.code} · needs renewal before travel`, date: day(r.dt), url: `/visamax/cases?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
  }

  if (brand === 'KS') {
    push(await q(`SELECT id, code, title, "customerName", "dueDate" AS dt, "assignedToUserId", "departmentId" FROM erp_tech_projects WHERE "departmentId" IN (:ids) AND stage NOT IN ('Completed','Cancelled','Maintenance','Deployed') AND ${within('dueDate', 60)}`, R),
      (r) => ({ kind: 'Project due', title: r.title, detail: `${r.code} · ${r.customerName || ''}`, date: day(r.dt), url: `/kurios/solutions?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, name, "customerName", "renewalDate" AS dt, "assignedToUserId", "departmentId" FROM erp_service_subscriptions WHERE "departmentId" IN (:ids) AND status <> 'Cancelled' AND "renewalDate" BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE + 30`, R),
      (r) => ({ kind: 'Renewal', title: r.name, detail: `${r.code} · ${r.customerName || ''}`, date: day(r.dt), url: `/kurios/solutions?tab=renewals&open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, subject, "slaDueAt" AS dt, "assignedToUserId", "departmentId" FROM erp_support_tickets WHERE "departmentId" IN (:ids) AND status NOT IN ('Resolved','Closed') AND "slaDueAt" IS NOT NULL AND "slaDueAt" < NOW() + INTERVAL '3 days'`, R),
      (r) => ({ kind: 'Ticket response due', title: r.subject, detail: r.code, date: day(r.dt), url: `/kurios/solutions?tab=tickets&open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, title, "startDate" AS dt, "departmentId" FROM courses WHERE "deletedAt" IS NULL AND "departmentId" IN (:ids) AND "startDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + :d`, R),
      (r) => ({ kind: 'Class starts', title: r.title, date: day(r.dt), url: `/lms/courses?school=KS`, departmentId: r.departmentId }));
  }

  if (brand === 'BM') {
    push(await q(`SELECT id, code, title, "customerName", "dueDate" AS dt, stage, "assignedToUserId", "departmentId" FROM erp_custom_orders WHERE "departmentId" IN (:ids) AND stage NOT IN ('Delivered','Cancelled') AND ${within('dueDate', 60)}`, R),
      (r) => ({ kind: r.stage === 'Ready' ? 'Ready — awaiting pick-up' : 'Custom order due', title: r.title || r.customerName, detail: `${r.code} · ${r.customerName}`, date: day(r.dt), url: `/beadmax/custom-orders?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, "customerName", total, "createdAt" AS dt, "assignedToUserId", "departmentId" FROM erp_shop_orders WHERE stage = 'New'`, R),
      (r) => ({ kind: 'Shop order to confirm', title: r.customerName, detail: `${r.code} · ₦${Number(r.total).toLocaleString()}`, date: day(r.dt), url: `/beadmax/shop?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, "customerName", "updatedAt" AS dt, "assignedToUserId", "departmentId" FROM erp_shop_orders WHERE stage IN ('Confirmed','Packed') AND "updatedAt" < NOW() - INTERVAL '2 days'`, R),
      (r) => ({ kind: 'Shop order waiting to ship', title: r.customerName, detail: r.code, date: day(r.dt), url: `/beadmax/shop?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, title, "startDate" AS dt, "departmentId" FROM courses WHERE "deletedAt" IS NULL AND "departmentId" IN (:ids) AND "startDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + :d`, R),
      (r) => ({ kind: 'Class starts', title: r.title, date: day(r.dt), url: `/lms/courses?school=BM`, departmentId: r.departmentId }));
    push(await q(`SELECT id, name, "stockQty", "reorderLevel", "updatedAt" AS dt, "departmentId" FROM erp_shop_products WHERE "isActive" = true AND "reorderLevel" > 0 AND "stockQty" <= "reorderLevel"`, R),
      (r) => ({ kind: 'Low stock', title: r.name, detail: `${Number(r.stockQty)} left`, date: today, url: `/beadmax/inventory?open=${r.id}`, departmentId: r.departmentId }));
  }

  if (brand === 'MF') {
    push(await q(`SELECT id, code, "customerName", "expectedDelivery" AS dt, "destinationCountry", stage, "assignedToUserId", "departmentId" FROM erp_export_orders WHERE "departmentId" IN (:ids) AND stage NOT IN ('Delivered','Cancelled') AND ${within('expectedDelivery', 60)}`, R),
      (r) => ({ kind: 'Delivery expected', title: r.customerName, detail: `${r.code} → ${r.destinationCountry} · ${r.stage}`, date: day(r.dt), url: `/maxfood?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, code, "customerName", "shipDate" AS dt, stage, "assignedToUserId", "departmentId" FROM erp_export_orders WHERE "departmentId" IN (:ids) AND stage IN ('Payment Confirmed','Sourcing','Processing & Packaging','Documentation','Customs Clearance') AND "shipDate" BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE + :d`, R),
      (r) => ({ kind: 'Ship date', title: r.customerName, detail: `${r.code} · ${r.stage}`, date: day(r.dt), url: `/maxfood?open=${r.id}`, ownerUserId: r.assignedToUserId, departmentId: r.departmentId }));
    push(await q(`SELECT id, name, "batchNo", "expiryDate" AS dt, "stockQty", "departmentId" FROM erp_food_products WHERE "isActive" = true AND "stockQty" > 0 AND "expiryDate" < CURRENT_DATE + 45`, R),
      (r) => ({ kind: 'Best-before date', title: r.name, detail: `${Number(r.stockQty)} in stock${r.batchNo ? ` · batch ${r.batchNo}` : ''}`, date: day(r.dt), url: `/maxfood?tab=products&open=${r.id}`, departmentId: r.departmentId }));
    push(await q(`SELECT id, name, "stockQty", "departmentId" FROM erp_food_products WHERE "isActive" = true AND "reorderLevel" > 0 AND "stockQty" <= "reorderLevel"`, R),
      (r) => ({ kind: 'Low stock', title: r.name, detail: `${Number(r.stockQty)} left`, date: today, url: `/maxfood?tab=products&open=${r.id}`, departmentId: r.departmentId }));
  }

  return items.sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.date.localeCompare(b.date));
}

/** Students who still owe fees, for a school (KS = Kurios training, BM = BeadMax vocational). */
export async function feeBalances(school: 'KS' | 'BM') {
  const codes = school === 'KS' ? ['KS-TRN', 'KS'] : ['BM-VOC', 'BM'];
  return q(
    `SELECT en.id AS "enrollmentId", c.title AS course, COALESCE(en.total_fee, c.fee, 0)::float AS fee,
            COALESCE((SELECT SUM("amountPaid") FROM fee_receipts fr WHERE fr."enrollmentId" = en.id AND fr."deletedAt" IS NULL), 0)::float AS paid,
            (SELECT MAX("paymentDate") FROM fee_receipts fr WHERE fr."enrollmentId" = en.id AND fr."deletedAt" IS NULL) AS "lastPayment",
            sp."studentNumber", TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')) AS name, u.email, u.phone,
            sp."guardianName", sp."guardianPhone", sp."guardianEmail", en."enrollmentDate", c."departmentId"
     FROM enrollments en JOIN courses c ON c.id = en."courseId" JOIN departments d ON d.id = c."departmentId"
     LEFT JOIN student_profiles sp ON sp.id = en."studentId" LEFT JOIN users u ON u.id = sp."userId"
     WHERE en."deletedAt" IS NULL AND UPPER(d.code) IN (:codes) AND COALESCE(en.status::text, '') NOT IN ('Cancelled', 'Withdrawn', 'Dropped')`,
    { codes },
  ).then((rows) => rows.map((r) => ({ ...r, balance: Math.round((Number(r.fee) - Number(r.paid)) * 100) / 100 })).filter((r) => r.balance > 0).sort((a, b) => b.balance - a.balance));
}

export function agendaRouter(): Router {
  const r = Router();

  r.get('/agenda', wrap(async (req, res) => {
    const brand = String(req.query.brand || '').toUpperCase();
    if (!['VM', 'KS', 'BM', 'MF'].includes(brand)) return fail(res, 400, 'Choose a brand');
    const items = await brandAgenda(brand, Math.min(60, Math.max(1, Number(req.query.days) || 14)));
    return ok(res, items);
  }));

  r.post('/agenda/run-reminders', wrap(async (req, res) => {
    if (!isManagement(req)) return fail(res, 403, 'Only management can send reminders now');
    await runMorningReminders();
    return ok(res, null, 'Reminders sent');
  }));

  r.get('/school/balances', wrap(async (req, res) => {
    const school = String(req.query.school || 'KS').toUpperCase() === 'BM' ? 'BM' : 'KS';
    const rows = await feeBalances(school);
    return ok(res, { school, total: rows.reduce((t, x) => t + x.balance, 0), students: rows });
  }));

  r.post('/school/balances/:enrollmentId/remind', wrap(async (req, res) => {
    if (!isManagement(req) && !['hod', 'accountant', 'hr'].includes(roleOf(req))) return fail(res, 403, 'Only heads, Accounts and management can send fee reminders');
    const all = [...(await feeBalances('KS')), ...(await feeBalances('BM'))];
    const s = all.find((x) => String(x.enrollmentId) === String(req.params.enrollmentId));
    if (!s) return fail(res, 404, 'No outstanding balance for this student');
    const to = s.email || s.guardianEmail;
    if (!to) return fail(res, 400, 'This student has no email address — call or WhatsApp them instead');
    const brand = await brandForDepartment(s.departmentId);
    const html = brandEmailHtml(brand, 'School fees reminder', `
      <p>Dear ${escapeHtml(s.name || s.guardianName || 'student')},</p>
      <p>This is a friendly reminder about the fees for <b>${escapeHtml(s.course)}</b>.</p>
      <table style="font-size:14px;border-collapse:collapse"><tr><td style="padding:4px 16px 4px 0">Total fee</td><td><b>₦${Number(s.fee).toLocaleString()}</b></td></tr>
      <tr><td style="padding:4px 16px 4px 0">Paid so far</td><td>₦${Number(s.paid).toLocaleString()}</td></tr>
      <tr><td style="padding:4px 16px 4px 0">Balance</td><td><b>₦${Number(s.balance).toLocaleString()}</b></td></tr></table>
      <p>Please pay the balance at the school office or by transfer, and send us your proof of payment. Thank you.</p>`);
    const sent = await sendBrandEmail(brand, to, `Fees reminder — ${s.course}`, html);
    await audit(req, 'School', 'Send', 'FeeReminder', s.enrollmentId, `${userName(req)} sent a fee reminder to ${to} (balance ₦${Number(s.balance).toLocaleString()})`);
    if (!sent.ok) return fail(res, 502, `The email could not be sent: ${sent.error || 'mail server error'}`);
    return ok(res, { to }, `Reminder sent to ${to}`);
  }));

  return r;
}

/** Morning digest to the people responsible + a few automatic customer reminders. */
export async function runMorningReminders(): Promise<void> {
  const tomorrow = lagosToday(1);
  const today = lagosToday();
  for (const brand of ['VM', 'KS', 'BM', 'MF']) {
    const items = (await brandAgenda(brand, 2)).filter((i) => i.overdue || i.date === today || i.date === tomorrow);
    if (!items.length) continue;
    const byUser = new Map<number, AgendaItem[]>();
    for (const it of items) {
      const owners = new Set<number>([...(it.ownerUserId ? [Number(it.ownerUserId)] : []), ...(await departmentHeadUserIds(it.departmentId))]);
      for (const u of owners) byUser.set(u, [...(byUser.get(u) || []), it]);
    }
    for (const [uid, list] of byUser) {
      const overdue = list.filter((i) => i.overdue).length;
      await notifyUsers(null, [uid], {
        title: `${brand === 'VM' ? 'VisaMax' : brand === 'KS' ? 'Kurios SAT' : brand === 'BM' ? 'BeadMax' : 'Maxfood Farm'}: ${list.length} thing${list.length > 1 ? 's' : ''} need${list.length > 1 ? '' : 's'} attention${overdue ? ` (${overdue} overdue)` : ''}`,
        message: list.slice(0, 4).map((i) => `${i.kind}: ${i.title}${i.overdue ? ' (overdue)' : i.date === today ? ' (today)' : ' (tomorrow)'}`).join(' · '),
        type: 'Alert', priority: overdue ? 'High' : 'Medium', actionUrl: list[0].url,
      });
    }
  }

  // VisaMax: remind customers of tomorrow's embassy appointment / biometrics (once).
  const appts = await q(
    `SELECT id, code, "customerName", "customerEmail", "appointmentDate", "biometricsDate", "departmentId", meta FROM erp_travel_cases
     WHERE "customerEmail" IS NOT NULL AND stage NOT IN ('Approved','Rejected','Travelled','Closed')
       AND ("appointmentDate"::date = :t OR "biometricsDate"::date = :t) AND COALESCE(meta->>'apptReminded', '') <> :t`, { t: tomorrow });
  for (const c of appts) {
    const brand = await brandForDepartment(c.departmentId);
    const what = day(c.appointmentDate) === tomorrow ? 'embassy appointment' : 'biometrics appointment';
    const ok1 = await sendBrandEmail(brand, c.customerEmail, `Reminder: your ${what} is tomorrow`, brandEmailHtml(brand, `Your ${what} is tomorrow`, `
      <p>Dear ${escapeHtml(c.customerName)},</p><p>This is a reminder that your <b>${what}</b> is <b>tomorrow, ${new Date(tomorrow).toDateString()}</b>.</p>
      <p>Please arrive early and bring your passport, appointment letter and the original documents we prepared with you. Call or WhatsApp us if anything is unclear.</p>
      <p>Your file number: <b>${escapeHtml(c.code)}</b></p>`));
    if (ok1.ok) await db.query(`UPDATE erp_travel_cases SET meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object('apptReminded', :t::text) WHERE id = :id`, { replacements: { t: tomorrow, id: c.id } });
  }

  // Kurios SAT: tell the client 14 days before a hosting / domain / support renewal (once).
  const renewals = await q(
    `SELECT id, code, name, "serviceType", "customerName", "customerEmail", "renewalDate", "sellingPrice" AS amount, currency, "departmentId", meta FROM erp_service_subscriptions
     WHERE "customerEmail" IS NOT NULL AND status <> 'Cancelled' AND "renewalDate" = CURRENT_DATE + 14 AND COALESCE(meta->>'clientReminded', '') <> "renewalDate"::text`);
  for (const s of renewals) {
    const brand = await brandForDepartment(s.departmentId);
    const ok2 = await sendBrandEmail(brand, s.customerEmail, `Your ${s.serviceType || 'service'} renews on ${new Date(s.renewalDate).toDateString()}`, brandEmailHtml(brand, 'Upcoming renewal', `
      <p>Dear ${escapeHtml(s.customerName)},</p><p>Your <b>${escapeHtml(s.name)}</b> (${escapeHtml(s.serviceType || 'service')}) is due for renewal on <b>${new Date(s.renewalDate).toDateString()}</b>${s.amount ? ` — <b>${escapeHtml(s.currency || 'NGN')} ${Number(s.amount).toLocaleString()}</b>` : ''}.</p>
      <p>Renew before the date to avoid any interruption. Reply to this email or call us if you have questions.</p>`));
    if (ok2.ok) await db.query(`UPDATE erp_service_subscriptions SET meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object('clientReminded', "renewalDate"::text) WHERE id = :id`, { replacements: { id: s.id } });
  }
}
