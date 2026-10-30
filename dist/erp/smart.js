"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WRITE_KINDS = void 0;
exports.buildSummary = buildSummary;
exports.runDailySummaries = runDailySummaries;
exports.smartRouter = smartRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const BRAND_VOICE = {
    VM: 'VisaMax Travel Ltd — travel and visa consultancy in Nigeria (visa applications, flights, hotels, tours, study abroad, family and business travel). Voice: warm, reassuring, precise about documents and deadlines, never promises a visa outcome.',
    KS: 'Kurios SAT — ICT company and tech training school in Nigeria (software development, IT support, networking, AI and automation, corporate and student training). Voice: confident, clear, practical, friendly to non-technical clients.',
    BM: 'BeadMax Design — handmade bead jewellery, accessories and custom orders, plus a vocational school teaching bead-making. Voice: creative, elegant, warm, celebrates craft and occasions (weddings, owambe, gifts).',
    MF: 'Maxfood Farm — Nigerian farm produce and food export (sourcing, processing, packaging and shipping to overseas buyers). Voice: professional, trustworthy, precise about quality, specifications, quantities, certificates and shipping terms.',
    HQ: 'MaxHub group — the parent company of VisaMax, Kurios SAT, BeadMax and Maxfood Farm. Voice: professional and warm.',
};
exports.WRITE_KINDS = {
    'Client email': 'An email to a client. Include a short clear subject line.',
    'Reply to a client': 'A reply to the client message given in the context. Answer their points directly and politely. Include a subject line.',
    'Proposal': 'A short business proposal with headings: Introduction, What we will do, Timeline, Price (only if figures are given), Next steps.',
    'Job advert': 'A job advert with: About us, The role, What you will do (bullets), What we are looking for (bullets), What we offer, How to apply.',
    'Social media post': 'A social media post (Instagram/Facebook/LinkedIn) with a hook first line, 2–4 short lines, a call to action and 3–6 relevant hashtags. Emojis allowed but sparing.',
    'WhatsApp message': 'A short, friendly WhatsApp message (under 80 words). No subject.',
    'Payment reminder': 'A polite but firm reminder about an unpaid balance. Include a subject line.',
    'Product description': 'A product description for the online shop: a one-line hook, a short paragraph, then key details as bullets.',
    'Letter': 'A formal letter with date line, greeting, body and sign-off.',
    'Announcement to staff': 'An internal announcement to staff. Clear, friendly, with what/when/what to do.',
};
async function myStaff(uid) {
    return (await q(`SELECT s.id, s."firstName", s."lastName", s.position, s."departmentId" FROM staff s WHERE s."userId" = :u AND s."deletedAt" IS NULL LIMIT 1`, { u: uid }))[0] || null;
}
function parseJson(text) {
    const t = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
        return JSON.parse(t);
    }
    catch { }
    const m = t.match(/\{[\s\S]*\}/);
    if (m) {
        try {
            return JSON.parse(m[0]);
        }
        catch { }
    }
    return null;
}
function provider() {
    const { getActiveProvider } = require('../modules/ai/providers/ProviderFactory');
    return getActiveProvider();
}
function lagosDate() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }); }
const timeOf = (d) => new Date(d).toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' });
async function pendingPolicies() {
    const out = new Map();
    const policies = await q(`SELECT * FROM erp_policies WHERE status = 'Published'`).catch(() => []);
    if (!policies.length)
        return out;
    for (const p of policies) {
        const ids = p.departmentId ? (await q(`SELECT id FROM departments WHERE id = :d OR "parentDepartmentId" = :d`, { d: p.departmentId })).map((r) => Number(r.id)) : null;
        const people = await q(`SELECT DISTINCT s."userId" FROM staff s WHERE s."deletedAt" IS NULL AND s.status = 'Active' AND s."userId" IS NOT NULL
       ${ids ? `AND (s."departmentId" IN (:ids) OR EXISTS (SELECT 1 FROM staff_departments sd WHERE sd."staffId" = s.id AND sd."departmentId" IN (:ids)))` : ''}
       AND NOT EXISTS (SELECT 1 FROM erp_policy_acks a WHERE a."policyId" = :p AND a.version = :v AND a."userId" = s."userId")`, { ids: ids || [0], p: p.id, v: p.version });
        for (const r of people)
            out.set(Number(r.userId), (out.get(Number(r.userId)) || 0) + 1);
    }
    return out;
}
async function buildSummary(uid, ctx = {}) {
    const today = lagosDate();
    const staff = await myStaff(uid);
    const items = [];
    const safe = (p, d) => p.catch(() => d);
    if (staff) {
        const tasks = await safe(q(`SELECT id, title, "dueDate" FROM tasks WHERE "assigneeId" = :s AND "deletedAt" IS NULL AND status NOT IN ('Done','Cancelled')
       AND "dueDate" IS NOT NULL AND ("dueDate" AT TIME ZONE 'Africa/Lagos')::date <= :t::date ORDER BY "dueDate"`, { s: staff.id, t: today }), []);
        const overdue = tasks.filter((t) => new Date(t.dueDate).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }) < today).length;
        if (tasks.length)
            items.push({ kind: 'tasks', count: tasks.length, urgent: overdue > 0, url: '/tasks', text: `${tasks.length} task${tasks.length === 1 ? '' : 's'} due${overdue ? ` (${overdue} overdue)` : ' today'}: ${tasks.slice(0, 2).map((t) => t.title).join(', ')}${tasks.length > 2 ? '…' : ''}` });
        const reviews = await safe(q(`SELECT COUNT(*)::int n FROM erp_reviews WHERE "staffId" = :s AND status = 'Self review'`, { s: staff.id }), [{ n: 0 }]);
        if (reviews[0]?.n)
            items.push({ kind: 'review', count: reviews[0].n, url: '/hr/reviews', text: 'Your performance review is waiting for your self-assessment' });
        const training = await safe(q(`SELECT title, "expiresOn" FROM erp_training_records WHERE "staffId" = :s AND "expiresOn" BETWEEN :t::date AND :t::date + 14`, { s: staff.id, t: today }), []);
        for (const t of training)
            items.push({ kind: 'training', url: '/training-records?mine=1', text: `Your “${t.title}” expires on ${new Date(t.expiresOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` });
    }
    const meetings = await safe(q(`SELECT m.title, m."scheduledAt" FROM meetings m WHERE m."deletedAt" IS NULL AND m.status <> 'Cancelled' AND (m."scheduledAt" AT TIME ZONE 'Africa/Lagos')::date = :t::date
     AND (m."hostUserId" = :u OR EXISTS (SELECT 1 FROM meeting_participants p WHERE p."meetingId" = m.id AND p."userId" = :u)) ORDER BY m."scheduledAt"`, { u: uid, t: today }), []);
    for (const m of meetings)
        items.push({ kind: 'meeting', url: '/messages', text: `Meeting “${m.title}” at ${timeOf(m.scheduledAt)}` });
    const interviews = await safe(q(`SELECT a."applicantName", j.title, c.interview->>'at' AS at FROM erp_candidates c JOIN job_applications a ON a.id = c."applicationId" JOIN job_postings j ON j.id = a."jobPostingId"
     WHERE c.stage = 'Interview' AND c.interview->'interviewerIds' @> to_jsonb(CAST(:u AS bigint)) AND ((c.interview->>'at')::timestamptz AT TIME ZONE 'Africa/Lagos')::date = :t::date`, { u: uid, t: today }), []);
    for (const i of interviews)
        items.push({ kind: 'interview', url: '/hr/recruitment', text: `Interview with ${i.applicantName} (${i.title}) at ${timeOf(i.at)}` });
    const bookings = await safe(q(`SELECT name, service, "startAt" FROM erp_bookings WHERE status = 'Confirmed' AND ("startAt" AT TIME ZONE 'Africa/Lagos')::date = :t::date AND "assignedToUserId" = :u ORDER BY "startAt"`, { u: uid, t: today }), []);
    for (const b of bookings)
        items.push({ kind: 'booking', url: '/bookings', text: `Consultation with ${b.name} (${b.service}) at ${timeOf(b.startAt)}` });
    const leave = await safe(q(`SELECT COUNT(*)::int n FROM leave_requests WHERE "approverUserId" = :u AND status = 'Pending' AND "deletedAt" IS NULL`, { u: uid }), [{ n: 0 }]);
    if (leave[0]?.n)
        items.push({ kind: 'approval', count: leave[0].n, url: '/leave/requests', text: `${leave[0].n} leave request${leave[0].n === 1 ? '' : 's'} to approve` });
    const headed = await (0, helpers_1.headedDepartmentIds)(uid);
    const mgmt = ctx.management ?? false;
    const purchases = await safe(q(`SELECT COUNT(*)::int n FROM erp_purchase_requests WHERE "requestedById" <> :u AND (
       (status = 'Waiting for head of department' AND "departmentId" IN (:h)) ${mgmt ? `OR status IN ('Waiting for head of department','Waiting for management')` : ''})`, { u: uid, h: headed.length ? headed : [0] }), [{ n: 0 }]);
    if (purchases[0]?.n)
        items.push({ kind: 'approval', count: purchases[0].n, url: '/purchases', text: `${purchases[0].n} purchase request${purchases[0].n === 1 ? '' : 's'} to approve` });
    if (ctx.accounts || mgmt) {
        const toBuy = await safe(q(`SELECT COUNT(*)::int n FROM erp_purchase_requests WHERE status = 'Approved'`), [{ n: 0 }]);
        if (toBuy[0]?.n && ctx.accounts)
            items.push({ kind: 'approval', count: toBuy[0].n, url: '/purchases', text: `${toBuy[0].n} approved purchase${toBuy[0].n === 1 ? '' : 's'} to pay out` });
    }
    const managerReviews = await safe(q(`SELECT COUNT(*)::int n FROM erp_reviews WHERE "reviewerUserId" = :u AND status = 'Manager review'`, { u: uid }), [{ n: 0 }]);
    if (managerReviews[0]?.n)
        items.push({ kind: 'approval', count: managerReviews[0].n, url: '/hr/reviews', text: `${managerReviews[0].n} performance review${managerReviews[0].n === 1 ? '' : 's'} to complete` });
    const pol = ctx.policies?.get(uid) ?? 0;
    if (pol)
        items.push({ kind: 'policy', count: pol, url: '/policies', text: `${pol} polic${pol === 1 ? 'y' : 'ies'} to read and accept` });
    for (const name of ctx.birthdays || [])
        items.push({ kind: 'birthday', url: '/dashboard', text: `🎂 It's ${name}'s birthday today — send a wish` });
    return { date: today, firstName: staff?.firstName || null, items };
}
async function birthdaysToday() {
    const t = lagosDate();
    const [, m, d] = t.split('-').map(Number);
    return (await q(`SELECT "userId", "firstName" || ' ' || "lastName" AS name FROM staff WHERE "deletedAt" IS NULL AND status = 'Active' AND "dateOfBirth" IS NOT NULL
     AND EXTRACT(MONTH FROM "dateOfBirth") = :m AND EXTRACT(DAY FROM "dateOfBirth") = :d`, { m, d }).catch(() => [])).map((r) => ({ userId: Number(r.userId), name: r.name }));
}
async function optedOut() {
    const row = await models_1.ErpModels.Setting?.findByPk('dailySummaryOff', { raw: true }).catch(() => null);
    return Array.isArray(row?.value) ? row.value.map(Number) : [];
}
async function runDailySummaries() {
    const users = await q(`SELECT DISTINCT s."userId" FROM staff s JOIN users u ON u.id = s."userId" AND u."deletedAt" IS NULL WHERE s."deletedAt" IS NULL AND s.status = 'Active' AND s."userId" IS NOT NULL`);
    const off = new Set(await optedOut());
    const policies = await pendingPolicies();
    const bdays = await birthdaysToday();
    const mgmt = new Set((await q(`SELECT DISTINCT ur."userId" FROM user_roles ur JOIN roles r ON r.id = ur."roleId" WHERE ur."deletedAt" IS NULL AND LOWER(r.code) IN ('superadmin','admin','super_admin')`).catch(() => [])).map((r) => Number(r.userId)));
    const accounts = new Set(await (0, helpers_1.userIdsWithRoles)(['accountant']).catch(() => []));
    let sent = 0;
    for (const u of users) {
        const uid = Number(u.userId);
        if (off.has(uid))
            continue;
        const s = await buildSummary(uid, { policies, birthdays: bdays.filter((b) => b.userId !== uid).map((b) => b.name.split(' ')[0]), management: mgmt.has(uid), accounts: accounts.has(uid) });
        const work = s.items.filter((i) => i.kind !== 'birthday');
        if (!work.length)
            continue;
        const day = new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'short' });
        await (0, helpers_1.notifyUsers)(null, [uid], {
            title: `Good morning${s.firstName ? `, ${s.firstName}` : ''} — your ${day}`,
            message: s.items.slice(0, 5).map((i) => `• ${i.text}`).join('\n'),
            type: 'Reminder', actionUrl: '/dashboard', priority: work.some((i) => i.urgent) ? 'High' : 'Medium',
        });
        sent++;
    }
    return sent;
}
function smartRouter() {
    const r = (0, express_1.Router)();
    r.get('/ai/write/meta', (0, recordRouter_1.wrap)(async (_req, res) => (0, recordRouter_1.ok)(res, { kinds: Object.keys(exports.WRITE_KINDS), tones: ['Warm', 'Professional', 'Formal', 'Short and direct', 'Persuasive', 'Celebratory'] })));
    r.post('/ai/write', (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        const kind = exports.WRITE_KINDS[b.kind] ? b.kind : 'Client email';
        const brand = ['VM', 'KS', 'BM', 'MF'].includes(String(b.brand)) ? String(b.brand) : 'HQ';
        const brief = String(b.brief || '').trim().slice(0, 4000);
        if (brief.length < 5)
            return (0, recordRouter_1.fail)(res, 400, 'Say what you want written');
        const me = await myStaff((0, helpers_1.userId)(req));
        const profile = brand === 'HQ' ? null : (await q(`SELECT "displayName", tagline, website, email, phone, whatsapp, address FROM erp_brand_profiles WHERE UPPER(code) = :c LIMIT 1`, { c: brand }))[0];
        const contact = profile ? [profile.displayName, profile.tagline, profile.phone, profile.whatsapp ? `WhatsApp ${profile.whatsapp}` : '', profile.email, profile.website, profile.address].filter(Boolean).join(' · ') : '';
        const prompt = [
            `You write for ${BRAND_VOICE[brand]}`,
            contact ? `Company details you may use in sign-offs: ${contact}.` : '',
            `Writer: ${(0, helpers_1.userName)(req)}${me?.position ? `, ${me.position}` : ''}.`,
            `Task: ${kind}. ${exports.WRITE_KINDS[kind]}`,
            `Tone: ${b.tone || 'Warm'}. Length: ${b.length || 'Medium'}. Language: ${b.language || 'English'} (Nigerian business context, British spelling, ₦ for naira).`,
            `What the writer wants:\n${brief}`,
            b.context ? `Background / message being replied to:\n${String(b.context).slice(0, 6000)}` : '',
            'Rules: never invent prices, dates, guarantees or facts that were not given — use a clear [placeholder] instead. No markdown symbols like ** or ##; use plain text with simple line breaks and "-" bullets.',
            'Answer ONLY with JSON: {"subject": "subject line or empty string", "text": "the full text"}',
        ].filter(Boolean).join('\n\n');
        let out;
        try {
            out = await provider().generate(prompt, undefined, 0.7);
        }
        catch (e) {
            return (0, recordRouter_1.fail)(res, e.status || 503, e.message || 'The AI could not write this right now');
        }
        const j = parseJson(out);
        return (0, recordRouter_1.ok)(res, { subject: j?.subject || '', text: (j?.text || out || '').replace(/\*\*/g, '').trim(), kind, brand });
    }));
    r.post('/ai/scan-receipt', (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        let data = String(b.imageBase64 || '');
        let mime = String(b.mimeType || 'image/jpeg');
        if (!data && /^https:\/\//.test(String(b.imageUrl || ''))) {
            const resp = await fetch(String(b.imageUrl), { signal: AbortSignal.timeout(20000) }).catch(() => null);
            if (!resp?.ok)
                return (0, recordRouter_1.fail)(res, 400, 'Could not open that image');
            mime = resp.headers.get('content-type') || mime;
            data = Buffer.from(await resp.arrayBuffer()).toString('base64');
        }
        data = data.replace(/^data:[^;]+;base64,/, '');
        if (!data)
            return (0, recordRouter_1.fail)(res, 400, 'Attach a photo of the receipt');
        if (data.length > 9000000)
            return (0, recordRouter_1.fail)(res, 400, 'That image is too large — please use a smaller photo');
        if (!/^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/.test(mime))
            return (0, recordRouter_1.fail)(res, 400, 'Use a photo (JPG or PNG) or a PDF of the receipt');
        const { EXPENSE_CATEGORIES } = require('./profit');
        const prompt = `Read this receipt or invoice (it is most likely Nigerian). Return ONLY JSON with these keys:
{"vendor": string|null, "date": "YYYY-MM-DD"|null, "total": number|null, "currency": "NGN"|"USD"|"GBP"|"EUR"|"QAR"|"AED"|..., "reference": string|null,
 "category": one of ${JSON.stringify(EXPENSE_CATEGORIES)}, "method": "Transfer"|"Cash"|"POS"|"Card"|"Cheque"|null,
 "items": [{"name": string, "qty": number, "amount": number}], "title": short description of what was bought (max 8 words), "confidence": "high"|"medium"|"low"}
Use the grand total (after VAT and charges). ₦ or NGN or "N" means NGN. If something is unreadable use null.`;
        let out;
        try {
            out = await provider().generateFromImage(prompt, data, mime);
        }
        catch (e) {
            return (0, recordRouter_1.fail)(res, e.status || 503, e.message || 'Could not read the receipt right now');
        }
        const j = parseJson(out);
        if (!j)
            return (0, recordRouter_1.fail)(res, 422, 'Could not read that receipt — try a clearer photo');
        const total = Number(String(j.total ?? '').replace(/[^\d.]/g, ''));
        return (0, recordRouter_1.ok)(res, {
            vendor: j.vendor || null, date: /^\d{4}-\d{2}-\d{2}$/.test(String(j.date)) ? j.date : null, total: total > 0 ? total : null,
            currency: String(j.currency || 'NGN').toUpperCase().slice(0, 3), reference: j.reference || null,
            category: EXPENSE_CATEGORIES.includes(j.category) ? j.category : 'Other', method: j.method || null,
            items: Array.isArray(j.items) ? j.items.slice(0, 30) : [], title: j.title || j.vendor || 'Receipt', confidence: j.confidence || 'medium',
        });
    }));
    r.get('/daily-summary', (0, recordRouter_1.wrap)(async (req, res) => {
        const uid = (0, helpers_1.userId)(req);
        const policies = await pendingPolicies();
        const bdays = (await birthdaysToday()).filter((b) => b.userId !== uid).map((b) => b.name.split(' ')[0]);
        const s = await buildSummary(uid, { policies, birthdays: bdays, management: (0, helpers_1.isManagement)(req), accounts: (0, helpers_1.roleOf)(req) === 'accountant' });
        const off = (await optedOut()).includes(uid);
        return (0, recordRouter_1.ok)(res, { ...s, morningMessage: !off, role: (0, helpers_1.roleOf)(req) });
    }));
    r.put('/daily-summary/settings', (0, recordRouter_1.wrap)(async (req, res) => {
        const uid = (0, helpers_1.userId)(req);
        const list = new Set(await optedOut());
        if (req.body?.morningMessage === false)
            list.add(uid);
        else
            list.delete(uid);
        await models_1.ErpModels.Setting.upsert({ key: 'dailySummaryOff', value: [...list] });
        return (0, recordRouter_1.ok)(res, { morningMessage: !list.has(uid) }, req.body?.morningMessage === false ? 'Morning message turned off' : 'Morning message turned on');
    }));
    return r;
}
//# sourceMappingURL=smart.js.map