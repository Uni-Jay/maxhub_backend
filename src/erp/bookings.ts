import { Router, Request } from 'express';
import { QueryTypes, Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ErpModels } from './models';
import { wrap, ok, fail } from './recordRouter';
import { audit, db, emitChange, headedDepartmentIds, isManagement, nextCode, notifyUsers, randomToken, roleOf, userId, userName, userIdsWithRoles, resolveDepartmentId } from './helpers';
import { brandEmailHtml, brandForDepartment, escapeHtml, sendBrandEmail } from './outbound';
import { rateLimit } from './rateLimit';

/**
 * Online consultation booking for the brand websites (VisaMax, Kurios SAT…).
 * Clients pick a service and a free time; MaxHub confirms by email, puts it on
 * the calendar, tells the consultants and sends a reminder the day before.
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;
const BRANDS = ['VM', 'KS', 'BM', 'MF'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const TZ = '+01:00'; // Lagos, no daylight saving

interface Service { name: string; minutes: number; modes: string[]; description?: string }
export interface BookingSettings {
  enabled: boolean; services: Service[]; hours: Record<string, Array<{ from: string; to: string }>>;
  slotMinutes: number; bufferMinutes: number; noticeHours: number; daysAhead: number; perSlot: number;
  location: string; videoNote: string; consultantUserIds: number[]; closedDates: string[]; intro: string;
}

const WEEKDAYS = { mon: [{ from: '09:00', to: '17:00' }], tue: [{ from: '09:00', to: '17:00' }], wed: [{ from: '09:00', to: '17:00' }], thu: [{ from: '09:00', to: '17:00' }], fri: [{ from: '09:00', to: '17:00' }] };
const DEFAULTS: Record<string, Partial<BookingSettings>> = {
  VM: {
    enabled: true, intro: 'Meet a VisaMax consultant at our office, by video or by phone.',
    services: ['Visa Services', 'Flight Booking', 'Hotel Booking (Home & Abroad)', 'Tourism Package', 'Overseas Studies', 'Family Visas', 'Business Travel', 'General Travel Consultation']
      .map((name) => ({ name, minutes: 30, modes: ['In person', 'Video call', 'Phone call'] })),
    hours: { ...WEEKDAYS, sat: [{ from: '10:00', to: '14:00' }] },
  },
  KS: {
    enabled: true, intro: 'Talk to Kurios SAT about a project, IT support or training.',
    services: [
      { name: 'Software, website or app project', minutes: 45, modes: ['Video call', 'In person'] },
      { name: 'IT support & networking', minutes: 30, modes: ['Phone call', 'Video call', 'In person'] },
      { name: 'AI & automation for your business', minutes: 45, modes: ['Video call', 'In person'] },
      { name: 'Corporate staff training', minutes: 30, modes: ['Video call', 'In person'] },
      { name: 'Join a training course (students)', minutes: 20, modes: ['Phone call', 'In person'] },
    ],
    hours: WEEKDAYS,
  },
  BM: { enabled: false, services: [{ name: 'Custom jewellery consultation', minutes: 30, modes: ['In person', 'Video call'] }, { name: 'Vocational school enquiry', minutes: 20, modes: ['Phone call', 'In person'] }], hours: { ...WEEKDAYS, sat: [{ from: '10:00', to: '15:00' }] } },
  MF: { enabled: false, services: [{ name: 'Export order enquiry', minutes: 30, modes: ['Video call', 'Phone call'] }, { name: 'Supplier / farmer partnership', minutes: 30, modes: ['Phone call', 'In person'] }], hours: WEEKDAYS },
};
const BASE: BookingSettings = { enabled: false, services: [], hours: {}, slotMinutes: 30, bufferMinutes: 0, noticeHours: 3, daysAhead: 30, perSlot: 1, location: '', videoNote: 'We will email you the video link before the meeting.', consultantUserIds: [], closedDates: [], intro: '' };

export async function bookingSettings(brand: string): Promise<BookingSettings> {
  const row: any = await ErpModels.Setting?.findByPk(`booking:${brand}`, { raw: true }).catch(() => null);
  const s = { ...BASE, ...(DEFAULTS[brand] || {}), ...(row?.value || {}) } as BookingSettings;
  if (!s.location) {
    const p = (await q(`SELECT address FROM erp_brand_profiles WHERE UPPER(code) = :c LIMIT 1`, { c: brand }).catch(() => [] as any[]))[0];
    s.location = p?.address || '';
  }
  return s;
}

async function brandDept(brand: string): Promise<number | null> { return resolveDepartmentId(brand); }
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const lagosToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
const fmtWhen = (d: Date) => d.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

async function isClosed(s: BookingSettings, date: string): Promise<string | null> {
  if (s.closedDates.includes(date)) return 'Closed';
  const { observancesBetween } = require('./observances');
  const h = (observancesBetween(date, date) as any[]).find((o) => o.kind === 'public-holiday');
  return h ? h.name : null;
}

/** Free start times (HH:MM, Lagos) for a date and service. */
export async function freeSlots(brand: string, date: string, serviceName: string): Promise<{ slots: string[]; closed?: string }> {
  const s = await bookingSettings(brand);
  const svc = s.services.find((x) => x.name === serviceName) || s.services[0];
  if (!s.enabled || !svc || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { slots: [] };
  const today = lagosToday();
  const last = new Date(`${today}T12:00:00Z`); last.setUTCDate(last.getUTCDate() + s.daysAhead);
  if (date < today || date > last.toISOString().slice(0, 10)) return { slots: [] };
  const closed = await isClosed(s, date);
  if (closed) return { slots: [], closed };
  const dow = DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
  const windows = s.hours[dow] || [];
  const taken = await q(
    `SELECT "startAt", "endAt" FROM erp_bookings WHERE brand = :b AND status IN ('Confirmed') AND "startAt" < :e AND "endAt" > :s`,
    { b: brand, s: new Date(`${date}T00:00:00${TZ}`), e: new Date(`${date}T23:59:59${TZ}`) },
  );
  const earliest = Date.now() + s.noticeHours * 3600_000;
  const step = Math.max(10, s.slotMinutes);
  const out: string[] = [];
  for (const w of windows) {
    for (let t = toMin(w.from); t + svc.minutes <= toMin(w.to); t += step) {
      const start = new Date(`${date}T${hhmm(t)}:00${TZ}`);
      const end = new Date(start.getTime() + (svc.minutes + s.bufferMinutes) * 60_000);
      if (start.getTime() < earliest) continue;
      const clash = taken.filter((b) => new Date(b.startAt) < end && new Date(b.endAt) > start).length;
      if (clash < Math.max(1, s.perSlot)) out.push(hhmm(t));
    }
  }
  return { slots: out };
}

async function staffForBrand(brand: string, s: BookingSettings): Promise<number[]> {
  if (s.consultantUserIds?.length) return s.consultantUserIds.map(Number);
  const d = await brandDept(brand);
  const heads = d ? (await q(`SELECT "headUserId" FROM departments WHERE id = :d AND "headUserId" IS NOT NULL`, { d })).map((r) => Number(r.headUserId)) : [];
  return heads.length ? heads : userIdsWithRoles(['superadmin', 'admin']);
}

function manageUrl(token: string, website?: string | null): string | null {
  if (!website) return null;
  const base = (/^https?:\/\//.test(website) ? website : `https://${website}`).replace(/\/$/, '');
  return `${base}/book?manage=${token}`;
}

async function emailBooking(kind: 'confirmed' | 'reminder' | 'cancelled', b: any) {
  const dept = await brandDept(b.brand);
  const brand: any = await brandForDepartment(dept);
  const s = await bookingSettings(b.brand);
  const when = fmtWhen(new Date(b.startAt));
  const how = b.mode === 'In person' ? `<b>Where:</b> ${escapeHtml(s.location || 'our office')}` : b.mode === 'Video call' ? `<b>How:</b> Video call — ${escapeHtml(s.videoNote)}` : `<b>How:</b> Phone call — we will call you on ${escapeHtml(b.phone || 'your number')}`;
  const link = manageUrl(b.manageToken, brand.website);
  const title = kind === 'confirmed' ? 'Your consultation is booked' : kind === 'reminder' ? 'See you tomorrow' : 'Your consultation has been cancelled';
  const body = kind === 'cancelled'
    ? `<p>Dear ${escapeHtml(b.name.split(' ')[0])},</p><p>Your ${escapeHtml(b.service)} consultation on <b>${when}</b> has been cancelled.</p><p>You can book a new time on our website whenever you are ready.</p>`
    : `<p>Dear ${escapeHtml(b.name.split(' ')[0])},</p><p>${kind === 'confirmed' ? 'Thank you for booking. Here are your details:' : 'A quick reminder about your consultation:'}</p>
       <p><b>Service:</b> ${escapeHtml(b.service)}<br/><b>When:</b> ${when} (Lagos time)<br/>${how}<br/><b>Reference:</b> ${escapeHtml(b.code)}</p>
       <p>Need to change it? ${link ? `<a href="${link}">Cancel or rebook here</a>` : 'Just reply to this email'}.</p>`;
  return sendBrandEmail(brand, b.email, `${title} — ${brand.displayName || 'MaxHub'}`, brandEmailHtml(brand, title, body)).catch(() => ({ ok: false }));
}

/** Hourly: email a reminder about consultations in the next 24 hours (once). */
export async function bookingReminders(): Promise<number> {
  const rows: any[] = await (ErpModels.Booking as any).findAll({
    where: { status: 'Confirmed', remindedAt: null, startAt: { [Op.between]: [new Date(Date.now() + 2 * 3600_000), new Date(Date.now() + 26 * 3600_000)] } }, raw: true,
  });
  for (const b of rows) {
    await emailBooking('reminder', b);
    await db.query(`UPDATE erp_bookings SET "remindedAt" = NOW() WHERE id = :id`, { replacements: { id: b.id } });
  }
  return rows.length;
}

async function cancelBooking(b: any, by: string, req: Request | null) {
  await db.query(`UPDATE erp_bookings SET status = 'Cancelled', meta = COALESCE(meta, '{}'::jsonb) || CAST(:m AS jsonb), "updatedAt" = NOW() WHERE id = :id`,
    { replacements: { id: b.id, m: JSON.stringify({ cancelledBy: by, cancelledAt: new Date().toISOString() }) } });
  if (b.calendarEventId) await db.query(`UPDATE calendar_events SET "deletedAt" = NOW() WHERE id = :id`, { replacements: { id: b.calendarEventId } }).catch(() => null);
  await emailBooking('cancelled', b);
  const s = await bookingSettings(b.brand);
  await notifyUsers(req, b.assignedToUserId ? [Number(b.assignedToUserId)] : await staffForBrand(b.brand, s), { title: 'Consultation cancelled', type: 'Alert', message: `${b.name} — ${b.service}, ${fmtWhen(new Date(b.startAt))} (cancelled by ${by})`, actionUrl: `/bookings?open=${b.id}` });
}

/** No login: used by the brand websites. */
export function bookingsPublicRouter(): Router {
  const r = Router();

  r.get('/bookings/:brand/options', wrap(async (req, res) => {
    const brand = String(req.params.brand).toUpperCase();
    if (!BRANDS.includes(brand)) return fail(res, 404, 'Unknown brand');
    const s = await bookingSettings(brand);
    if (!s.enabled) return ok(res, { enabled: false });
    const today = lagosToday();
    const days: Array<{ date: string; open: boolean; closed?: string }> = [];
    for (let i = 0; i <= s.daysAhead; i++) {
      const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i);
      const date = d.toISOString().slice(0, 10);
      const dow = DAYS[d.getUTCDay()];
      const closed = await isClosed(s, date);
      days.push({ date, open: !closed && (s.hours[dow] || []).length > 0, closed: closed || undefined });
    }
    return ok(res, { enabled: true, intro: s.intro, services: s.services, location: s.location, videoNote: s.videoNote, days });
  }));

  r.get('/bookings/:brand/slots', rateLimit('booking-slots', 120, 60_000), wrap(async (req, res) => {
    const brand = String(req.params.brand).toUpperCase();
    if (!BRANDS.includes(brand)) return fail(res, 404, 'Unknown brand');
    return ok(res, await freeSlots(brand, String(req.query.date || ''), String(req.query.service || '')));
  }));

  r.post('/bookings/:brand', rateLimit('booking-create', 6, 60 * 60_000), wrap(async (req, res) => {
    const brand = String(req.params.brand).toUpperCase();
    if (!BRANDS.includes(brand)) return fail(res, 404, 'Unknown brand');
    const s = await bookingSettings(brand);
    if (!s.enabled) return fail(res, 400, 'Online booking is not open at the moment');
    const b = req.body || {};
    const name = String(b.name || '').trim().slice(0, 160);
    const email = String(b.email || '').trim().toLowerCase().slice(0, 160);
    const phone = String(b.phone || '').trim().slice(0, 40);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.replace(/\D/g, '').length < 7) return fail(res, 400, 'Please give your name, a valid email and phone number');
    const svc = s.services.find((x) => x.name === b.service);
    if (!svc) return fail(res, 400, 'Choose a service');
    const mode = svc.modes.includes(b.mode) ? b.mode : svc.modes[0] || 'In person';
    const date = String(b.date || ''); const time = String(b.time || '');
    const { slots } = await freeSlots(brand, date, svc.name);
    if (!slots.includes(time)) return fail(res, 409, 'Sorry, that time has just been taken — please pick another');
    const startAt = new Date(`${date}T${time}:00${TZ}`);
    const endAt = new Date(startAt.getTime() + svc.minutes * 60_000);
    const dept = await brandDept(brand);
    const consultants = await staffForBrand(brand, s);
    // Share bookings fairly: the consultant with the fewest upcoming bookings.
    let assigned: number | null = null;
    if (consultants.length) {
      const loads = await q(`SELECT "assignedToUserId" u, COUNT(*)::int n FROM erp_bookings WHERE brand = :b AND status = 'Confirmed' AND "startAt" > NOW() GROUP BY 1`, { b: brand });
      const lm = new Map(loads.map((l) => [Number(l.u), Number(l.n)]));
      assigned = [...consultants].sort((a, c) => (lm.get(a) || 0) - (lm.get(c) || 0))[0];
    }
    const prefix = (await q(`SELECT "receiptPrefix" FROM erp_brand_profiles WHERE UPPER(code) = :c`, { c: brand }))[0]?.receiptPrefix || brand;
    const row: any = await (ErpModels.Booking as any).create({
      code: await nextCode(`${prefix}-BK`), brand, service: svc.name, mode, startAt, endAt, name, email, phone, notes: b.notes ? String(b.notes).slice(0, 3000) : null,
      status: 'Confirmed', manageToken: randomToken(24), departmentId: dept, assignedToUserId: assigned, meta: { source: String(req.get('origin') || 'website').slice(0, 120) },
    });
    try {
      const { CalendarEvent } = require('@models/CalendarEvent.model');
      const ev: any = await CalendarEvent.create({ uuid: uuidv4(), title: `Consultation: ${name} (${svc.name})`, date: startAt, endDate: endAt, type: 'Meeting', description: `${mode} · ${phone} · ${email} · ${row.code}`, createdById: assigned || undefined });
      await row.update({ calendarEventId: ev.id });
    } catch (e: any) { console.error('[bookings] calendar failed:', e.message); }
    // Lead in the CRM so the client is not lost.
    try {
      const has = await q(`SELECT id FROM contacts WHERE LOWER(email) = :e AND "deletedAt" IS NULL LIMIT 1`, { e: email });
      if (!has[0]) {
        const [first, ...rest] = name.split(' ');
        await db.query(`INSERT INTO contacts (uuid, "contactCode", "firstName", "lastName", email, phone, source, status, notes, "createdAt", "updatedAt")
          VALUES (:u, :c, :f, :l, :e, :p, 'Website', 'Lead', :n, NOW(), NOW())`, { replacements: { u: uuidv4(), c: `BK-${Date.now().toString(36).toUpperCase()}`, f: first, l: rest.join(' ') || '-', e: email, p: phone, n: `Booked ${svc.name} (${row.code})` } });
      }
    } catch { /* contacts table differs on some installs */ }
    await emailBooking('confirmed', row.get({ plain: true }));
    await notifyUsers(null, assigned ? [assigned] : consultants, { title: 'New consultation booked', type: 'Assignment', priority: 'High', message: `${name} — ${svc.name} (${mode}), ${fmtWhen(startAt)}`, actionUrl: `/bookings?open=${row.id}` });
    emitChange(null, 'booking', 'created', { id: row.id });
    return ok(res, { code: row.code, when: fmtWhen(startAt), service: svc.name, mode, manageToken: row.manageToken }, `Booked! We have emailed the details to ${email}.`, 201);
  }));

  r.get('/bookings/manage/:token', rateLimit('booking-manage', 30, 10 * 60_000), wrap(async (req, res) => {
    const b: any = await (ErpModels.Booking as any).findOne({ where: { manageToken: String(req.params.token) }, raw: true });
    if (!b) return fail(res, 404, 'Booking not found');
    return ok(res, { code: b.code, brand: b.brand, service: b.service, mode: b.mode, when: fmtWhen(new Date(b.startAt)), startAt: b.startAt, status: b.status, name: b.name, canCancel: b.status === 'Confirmed' && new Date(b.startAt) > new Date() });
  }));

  r.post('/bookings/manage/:token/cancel', rateLimit('booking-manage', 30, 10 * 60_000), wrap(async (req, res) => {
    const b: any = await (ErpModels.Booking as any).findOne({ where: { manageToken: String(req.params.token) }, raw: true });
    if (!b) return fail(res, 404, 'Booking not found');
    if (b.status !== 'Confirmed' || new Date(b.startAt) <= new Date()) return fail(res, 400, 'This booking can no longer be cancelled online');
    await cancelBooking(b, 'the client', null);
    emitChange(null, 'booking', 'updated', { id: b.id });
    return ok(res, { status: 'Cancelled' }, 'Your booking has been cancelled');
  }));

  return r;
}

/** Staff side (login). */
export function bookingsRouter(): Router {
  const r = Router();
  const canManage = async (req: Request, brand: string) => {
    if (isManagement(req)) return true;
    const d = await brandDept(brand);
    return !!d && (await headedDepartmentIds(userId(req))).includes(d);
  };

  r.get('/bookings', wrap(async (req, res) => {
    const where: any = {};
    if (req.query.brand && BRANDS.includes(String(req.query.brand))) where.brand = String(req.query.brand);
    if (req.query.status && req.query.status !== 'All') where.status = String(req.query.status);
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 86400_000);
    where.startAt = { [Op.gte]: from };
    const me = userId(req);
    const headed = await headedDepartmentIds(me);
    const rows: any[] = await (ErpModels.Booking as any).findAll({ where, order: [['startAt', 'ASC']], limit: 1000, raw: true });
    const visible = isManagement(req) || roleOf(req) === 'hr' ? rows : rows.filter((b) => Number(b.assignedToUserId) === me || headed.includes(Number(b.departmentId)));
    const names = new Map((await q(`SELECT id, COALESCE(NULLIF(TRIM(COALESCE("firstName",'') || ' ' || COALESCE("lastName",'')), ''), email) n FROM users WHERE id IN (:ids)`,
      { ids: [...new Set(visible.map((b) => Number(b.assignedToUserId)).filter(Boolean)), 0] })).map((u) => [Number(u.id), u.n]));
    const brands: Record<string, boolean> = {};
    for (const b of BRANDS) brands[b] = await canManage(req, b);
    return ok(res, { bookings: visible.map(({ manageToken, ...b }) => ({ ...b, id: Number(b.id), assignedName: names.get(Number(b.assignedToUserId)) || null, mine: Number(b.assignedToUserId) === me, _t: !!manageToken })), canManage: brands });
  }));

  r.put('/bookings/:id(\\d+)', wrap(async (req, res) => {
    const row: any = await (ErpModels.Booking as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Booking not found');
    const mine = Number(row.assignedToUserId) === userId(req);
    if (!mine && !(await canManage(req, row.brand))) return fail(res, 403, 'You cannot change this booking');
    const b = req.body || {};
    if (b.status === 'Cancelled' && row.status !== 'Cancelled') { await cancelBooking(row.get({ plain: true }), userName(req), req); await row.reload(); }
    const data: any = {};
    if (['Completed', 'No-show', 'Confirmed'].includes(b.status)) data.status = b.status;
    if (b.staffNotes !== undefined) data.staffNotes = String(b.staffNotes).slice(0, 5000) || null;
    if (b.assignedToUserId !== undefined && (await canManage(req, row.brand))) data.assignedToUserId = b.assignedToUserId ? Number(b.assignedToUserId) : null;
    if (Object.keys(data).length) await row.update(data);
    if (data.assignedToUserId && data.assignedToUserId !== userId(req)) await notifyUsers(req, [data.assignedToUserId], { title: 'Consultation assigned to you', type: 'Assignment', message: `${row.name} — ${row.service}, ${fmtWhen(new Date(row.startAt))}`, actionUrl: `/bookings?open=${row.id}` });
    await audit(req, 'Bookings', 'Update', 'Booking', row.id, `${userName(req)} updated booking ${row.code} (${row.status})`);
    emitChange(req, 'booking', 'updated', { id: row.id });
    return ok(res, row, 'Booking updated');
  }));

  r.get('/booking-settings/:brand', wrap(async (req, res) => {
    const brand = String(req.params.brand).toUpperCase();
    if (!BRANDS.includes(brand)) return fail(res, 404, 'Unknown brand');
    const site = (await q(`SELECT website FROM erp_brand_profiles WHERE UPPER(code) = :c LIMIT 1`, { c: brand }))[0]?.website || null;
    return ok(res, { ...(await bookingSettings(brand)), canEdit: await canManage(req, brand), bookingPage: site ? `${String(site).replace(/\/$/, '')}/book` : null });
  }));

  r.put('/booking-settings/:brand', wrap(async (req, res) => {
    const brand = String(req.params.brand).toUpperCase();
    if (!BRANDS.includes(brand)) return fail(res, 404, 'Unknown brand');
    if (!(await canManage(req, brand))) return fail(res, 403, 'Only management or the head of this brand can change booking settings');
    const b = req.body || {};
    const time = (t: any) => (/^\d{2}:\d{2}$/.test(String(t)) ? String(t) : null);
    const hours: BookingSettings['hours'] = {};
    for (const d of DAYS) hours[d] = (Array.isArray(b.hours?.[d]) ? b.hours[d] : []).map((w: any) => ({ from: time(w?.from), to: time(w?.to) })).filter((w: any) => w.from && w.to && w.from < w.to).slice(0, 4) as Array<{ from: string; to: string }>;
    const value: BookingSettings = {
      enabled: !!b.enabled,
      services: (Array.isArray(b.services) ? b.services : []).map((s: any) => ({ name: String(s?.name || '').trim().slice(0, 160), minutes: Math.min(240, Math.max(10, Number(s?.minutes) || 30)), modes: (Array.isArray(s?.modes) ? s.modes : []).filter((m: string) => ['In person', 'Video call', 'Phone call'].includes(m)), description: s?.description ? String(s.description).slice(0, 300) : undefined }))
        .filter((s: Service) => s.name && s.modes.length).slice(0, 30),
      hours, slotMinutes: Math.min(120, Math.max(10, Number(b.slotMinutes) || 30)), bufferMinutes: Math.min(60, Math.max(0, Number(b.bufferMinutes) || 0)),
      noticeHours: Math.min(168, Math.max(0, Number(b.noticeHours) || 0)), daysAhead: Math.min(120, Math.max(1, Number(b.daysAhead) || 30)), perSlot: Math.min(10, Math.max(1, Number(b.perSlot) || 1)),
      location: String(b.location || '').slice(0, 300), videoNote: String(b.videoNote || '').slice(0, 300), intro: String(b.intro || '').slice(0, 500),
      consultantUserIds: (Array.isArray(b.consultantUserIds) ? b.consultantUserIds : []).map(Number).filter(Boolean),
      closedDates: (Array.isArray(b.closedDates) ? b.closedDates : []).filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 100),
    };
    await (ErpModels.Setting as any).upsert({ key: `booking:${brand}`, value });
    await audit(req, 'Bookings', 'Update', 'Settings', brand, `${userName(req)} updated online booking settings for ${brand}${value.enabled ? '' : ' (booking turned off)'}`);
    return ok(res, value, 'Booking settings saved');
  }));

  r.get('/booking-settings/:brand/preview', wrap(async (req, res) => {
    const brand = String(req.params.brand).toUpperCase();
    return ok(res, await freeSlots(brand, String(req.query.date || lagosToday()), String(req.query.service || '')));
  }));

  return r;
}
