"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRITERIA = void 0;
exports.startOnboarding = startOnboarding;
exports.buildEvidence = buildEvidence;
exports.developmentRouter = developmentRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const one = async (sql, rep) => Number((await q(sql, rep).catch(() => [{ v: 0 }]))[0]?.v || 0);
const TEMPLATE = [
    { section: 'Before day one', title: 'Offer letter signed and returned', owner: 'HR', day: -3 },
    { section: 'Before day one', title: 'MaxHub account created and welcome email sent', owner: 'HR', day: -2, auto: 'account' },
    { section: 'Before day one', title: 'Documents collected (ID, CV, certificates, guarantor forms)', owner: 'HR', day: -1 },
    { section: 'Before day one', title: 'Monthly pay set in Staff Pay', owner: 'Accounts', day: -1, auto: 'pay' },
    { section: 'Before day one', title: 'Bank details recorded for salary', owner: 'Accounts', day: 0, auto: 'bank' },
    { section: 'First day', title: 'Welcome and introduction to the team', owner: 'Manager', day: 0 },
    { section: 'First day', title: 'Office tour, safety and house rules', owner: 'HR', day: 0 },
    { section: 'First day', title: 'Laptop, phone line, email and tools set up', owner: 'IT', day: 0 },
    { section: 'First day', title: 'Company policies and job description sent for signing', owner: 'HR', day: 0 },
    { section: 'First day', title: 'Profile photo and emergency contact added in MaxHub', owner: 'Staff', day: 1, auto: 'profile' },
    { section: 'First week', title: 'Role and expectations meeting with manager', owner: 'Manager', day: 2 },
    { section: 'First week', title: 'First tasks assigned in MaxHub', owner: 'Manager', day: 3, auto: 'tasks' },
    { section: 'First week', title: 'MaxHub training: messages, tasks, calendar, weekly report', owner: 'HR', day: 3 },
    { section: 'First week', title: 'Policies and job description signed', owner: 'Staff', day: 5 },
    { section: 'First week', title: 'First weekly report submitted', owner: 'Staff', day: 7, auto: 'weekly' },
    { section: 'First month', title: '30-day check-in with manager', owner: 'Manager', day: 30 },
    { section: 'First month', title: 'Probation goals agreed and written down', owner: 'Manager', day: 30 },
    { section: 'First month', title: 'HR feedback conversation', owner: 'HR', day: 30 },
];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
async function startOnboarding(staffId, req) {
    const existing = await one(`SELECT COUNT(*)::int v FROM erp_onboarding_items WHERE "staffId" = :s`, { s: staffId });
    if (existing)
        return 0;
    const s = (await q(`SELECT "joiningDate", "hireDate", "userId", "firstName" FROM staff WHERE id = :s`, { s: staffId }))[0];
    if (!s)
        return 0;
    const start = new Date(s.joiningDate || s.hireDate || Date.now());
    await models_1.ErpModels.OnboardingItem.bulkCreate(TEMPLATE.map((t, i) => ({
        staffId, section: t.section, title: t.title, owner: t.owner, dueDate: addDays(start, t.day), sortOrder: i, note: t.auto ? `auto:${t.auto}` : null,
    })));
    if (s.userId) {
        await (0, helpers_1.notifyUsers)(req || null, [Number(s.userId)], { title: 'Your onboarding checklist is ready', message: 'See what to expect in your first weeks and tick off your own steps.', type: 'System', actionUrl: '/hr/onboarding?mine=1' });
    }
    return TEMPLATE.length;
}
async function autoComplete(staffId) {
    const items = await q(`SELECT id, note FROM erp_onboarding_items WHERE "staffId" = :s AND "doneAt" IS NULL AND note LIKE 'auto:%'`, { s: staffId });
    if (!items.length)
        return;
    const s = (await q(`SELECT s."userId", s."accountNumber", s."emergencyContactName", u.avatar FROM staff s LEFT JOIN users u ON u.id = s."userId" WHERE s.id = :s`, { s: staffId }))[0] || {};
    const checks = {
        account: async () => !!s.userId,
        pay: async () => (await one(`SELECT COUNT(*)::int v FROM erp_staff_pay WHERE "staffId" = :s AND "basicSalary" > 0`, { s: staffId })) > 0,
        bank: async () => !!s.accountNumber,
        profile: async () => !!s.avatar && !!s.emergencyContactName,
        tasks: async () => (await one(`SELECT COUNT(*)::int v FROM tasks WHERE "assigneeId" = :s AND "deletedAt" IS NULL`, { s: staffId })) > 0,
        weekly: async () => (await one(`SELECT COUNT(*)::int v FROM weekly_reports WHERE "staffId" = :s AND "deletedAt" IS NULL`, { s: staffId })) > 0,
    };
    for (const it of items) {
        const key = String(it.note).slice(5);
        if (checks[key] && (await checks[key]().catch(() => false))) {
            await helpers_1.db.query(`UPDATE erp_onboarding_items SET "doneAt" = NOW(), "doneByName" = 'MaxHub (automatic)', "updatedAt" = NOW() WHERE id = :id`, { replacements: { id: it.id } });
        }
    }
}
async function myStaffId(req) {
    const r = (await q(`SELECT id FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: (0, helpers_1.userId)(req) }))[0];
    return r ? Number(r.id) : null;
}
async function manageableStaffIds(req) {
    if ((0, helpers_1.isManagement)(req) || (0, helpers_1.roleOf)(req) === 'hr')
        return 'all';
    if ((0, helpers_1.roleOf)(req) === 'hod') {
        const depts = await (0, helpers_1.headedDepartmentIds)((0, helpers_1.userId)(req));
        if (!depts.length)
            return [];
        const rows = await q(`SELECT DISTINCT s.id FROM staff s LEFT JOIN staff_departments sd ON sd."staffId" = s.id
       WHERE s."deletedAt" IS NULL AND (s."departmentId" IN (:d) OR sd."departmentId" IN (:d))`, { d: depts });
        return rows.map((r) => Number(r.id));
    }
    return [];
}
const canManageStaff = (scope, staffId) => scope === 'all' || scope.includes(staffId);
exports.CRITERIA = [
    { key: 'quality', label: 'Quality of work', hint: 'Accurate, careful, finished to a high standard' },
    { key: 'productivity', label: 'Productivity', hint: 'Gets the agreed work done on time' },
    { key: 'reliability', label: 'Reliability & punctuality', hint: 'Attendance, keeping promises, weekly reports' },
    { key: 'customer', label: 'Customer care', hint: 'How customers, students and clients are treated' },
    { key: 'teamwork', label: 'Teamwork', hint: 'Helps colleagues across the brands' },
    { key: 'communication', label: 'Communication', hint: 'Clear, timely updates' },
    { key: 'initiative', label: 'Initiative & growth', hint: 'Solves problems, learns, suggests improvements' },
];
const RATING = (s) => (s >= 4.5 ? 'Outstanding' : s >= 3.5 ? 'Exceeds expectations' : s >= 2.5 ? 'Meets expectations' : s >= 1.5 ? 'Needs improvement' : 'Unsatisfactory');
async function buildEvidence(staffId, from, to) {
    const R = { s: staffId, f: from, t: to };
    const staff = (await q(`SELECT "userId", "firstName", "lastName" FROM staff WHERE id = :s`, R))[0] || {};
    const uid = staff.userId ? Number(staff.userId) : 0;
    const tasks = (await q(`SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'Done')::int AS done,
            COUNT(*) FILTER (WHERE status = 'Done' AND ("dueDate" IS NULL OR "updatedAt"::date <= "dueDate"::date))::int AS "onTime",
            COUNT(*) FILTER (WHERE status NOT IN ('Done','Cancelled') AND "dueDate" < NOW())::int AS overdue,
            COUNT(*) FILTER (WHERE status = 'Blocked')::int AS blocked
     FROM tasks WHERE "assigneeId" = :s AND "deletedAt" IS NULL AND "createdAt"::date <= :t AND ("dueDate" IS NULL OR "dueDate"::date >= :f OR status NOT IN ('Done','Cancelled'))`, R).catch(() => q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'Done')::int AS done, 0 AS "onTime",
            COUNT(*) FILTER (WHERE status NOT IN ('Done','Cancelled') AND "dueDate" < NOW())::int AS overdue, COUNT(*) FILTER (WHERE status = 'Blocked')::int AS blocked
     FROM tasks WHERE "assigneeId" = :s AND "deletedAt" IS NULL AND "createdAt"::date <= :t`, R)))[0] || {};
    const weeks = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / (7 * 86400000)));
    const reports = (await q(`SELECT COUNT(*)::int AS submitted, COUNT(*) FILTER (WHERE "approvalStatus" = 'Approved')::int AS approved
     FROM weekly_reports WHERE "staffId" = :s AND "deletedAt" IS NULL AND "weekEnding" BETWEEN :f AND :t`, R).catch(() => [{}]))[0] || {};
    const attendance = (await q(`SELECT COUNT(*) FILTER (WHERE status::text IN ('Present','Late','HalfDay','Half Day','WorkFromHome'))::int AS present,
            COUNT(*) FILTER (WHERE status::text = 'Late')::int AS late,
            COUNT(*) FILTER (WHERE status::text = 'Absent')::int AS absent
     FROM attendance WHERE "staffId" = :s AND "attendanceDate" BETWEEN :f AND :t`, R).catch(() => [{}]))[0] || {};
    const leave = await one(`SELECT COALESCE(SUM("numberofDays"),0)::float v FROM leave_requests WHERE "staffId" = :s AND status = 'Approved' AND "deletedAt" IS NULL AND "startDate" BETWEEN :f AND :t`, R);
    const brandJobs = {};
    if (uid) {
        const jobs = [
            ['VisaMax customers', 'erp_travel_cases', ['Approved', 'Travelled', 'Closed']],
            ['Kurios SAT projects', 'erp_tech_projects', ['Deployed', 'Completed']],
            ['Support tickets', 'erp_support_tickets', ['Resolved', 'Closed']],
            ['BeadMax custom orders', 'erp_custom_orders', ['Delivered']],
            ['BeadMax shop orders', 'erp_shop_orders', ['Delivered']],
            ['Maxfood export orders', 'erp_export_orders', ['Delivered']],
        ];
        for (const [label, table, doneStages] of jobs) {
            const stageCol = table === 'erp_support_tickets' ? 'status' : 'stage';
            const r = (await q(`SELECT COUNT(*)::int AS handled, COUNT(*) FILTER (WHERE ${stageCol} IN (:d))::int AS completed FROM ${table}
         WHERE "assignedToUserId" = :u AND "updatedAt"::date BETWEEN :f AND :t`, { ...R, u: uid, d: doneStages }).catch(() => [{ handled: 0, completed: 0 }]))[0];
            if (Number(r?.handled))
                brandJobs[label] = { handled: Number(r.handled), completed: Number(r.completed) };
        }
    }
    const receipts = uid ? await one(`SELECT COUNT(*)::int v FROM erp_payments WHERE "createdById" = :u AND status = 'Completed' AND "paidAt"::date BETWEEN :f AND :t`, { ...R, u: uid }) : 0;
    const customerReports = uid ? await one(`SELECT COUNT(*)::int v FROM customer_reports WHERE "createdById" = :u AND "deletedAt" IS NULL AND "createdAt"::date BETWEEN :f AND :t`, { ...R, u: uid }) : 0;
    return {
        period: { from, to, weeks },
        tasks: { total: Number(tasks.total || 0), done: Number(tasks.done || 0), onTime: Number(tasks.onTime || 0), overdue: Number(tasks.overdue || 0), blocked: Number(tasks.blocked || 0) },
        weeklyReports: { submitted: Number(reports.submitted || 0), expected: weeks, approved: Number(reports.approved || 0) },
        attendance: { present: Number(attendance.present || 0), late: Number(attendance.late || 0), absent: Number(attendance.absent || 0) },
        leaveDays: leave, brandJobs, receiptsIssued: receipts, customerReports,
        generatedAt: new Date().toISOString(),
    };
}
async function reviewRow(id) {
    return (await q(`SELECT r.*, s."firstName", s."lastName", s.position, s."userId" AS "staffUserId", d.name AS department,
            NULLIF(TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')), '') AS "reviewerName"
     FROM erp_reviews r JOIN staff s ON s.id = r."staffId" LEFT JOIN departments d ON d.id = s."departmentId" LEFT JOIN users u ON u.id = r."reviewerUserId"
     WHERE r.id = :id`, { id }))[0];
}
function developmentRouter() {
    const r = (0, express_1.Router)();
    r.get('/onboarding', (0, recordRouter_1.wrap)(async (req, res) => {
        const scope = await manageableStaffIds(req);
        const mine = await myStaffId(req);
        const rows = await q(`SELECT s.id AS "staffId", s."firstName", s."lastName", s.position, s."joiningDate", d.name AS department,
              COUNT(o.id)::int AS total, COUNT(o."doneAt")::int AS done,
              COUNT(o.id) FILTER (WHERE o."doneAt" IS NULL AND o."dueDate" < CURRENT_DATE)::int AS overdue
       FROM erp_onboarding_items o JOIN staff s ON s.id = o."staffId" LEFT JOIN departments d ON d.id = s."departmentId"
       WHERE s."deletedAt" IS NULL GROUP BY s.id, d.name ORDER BY s."joiningDate" DESC NULLS LAST`);
        const visible = rows.filter((x) => canManageStaff(scope, Number(x.staffId)) || Number(x.staffId) === mine);
        const without = scope === 'all' ? await q(`SELECT s.id AS "staffId", s."firstName", s."lastName", s."joiningDate" FROM staff s
       WHERE s."deletedAt" IS NULL AND COALESCE(s.status::text,'Active') = 'Active'
         AND NOT EXISTS (SELECT 1 FROM erp_onboarding_items o WHERE o."staffId" = s.id) ORDER BY s."joiningDate" DESC NULLS LAST LIMIT 50`) : [];
        return (0, recordRouter_1.ok)(res, { checklists: visible, withoutChecklist: without, myStaffId: mine, canManage: scope === 'all' || (Array.isArray(scope) && scope.length > 0) });
    }));
    r.get('/onboarding/:staffId(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const staffId = Number(req.params.staffId);
        const scope = await manageableStaffIds(req);
        if (!canManageStaff(scope, staffId) && (await myStaffId(req)) !== staffId)
            return (0, recordRouter_1.fail)(res, 403, 'You can only see your own checklist');
        await autoComplete(staffId);
        const items = await q(`SELECT * FROM erp_onboarding_items WHERE "staffId" = :s ORDER BY "sortOrder", id`, { s: staffId });
        const staff = (await q(`SELECT s.id, s."firstName", s."lastName", s.position, s."joiningDate", d.name AS department FROM staff s LEFT JOIN departments d ON d.id = s."departmentId" WHERE s.id = :s`, { s: staffId }))[0];
        return (0, recordRouter_1.ok)(res, { staff, items, canManage: canManageStaff(scope, staffId) });
    }));
    r.post('/onboarding/:staffId(\\d+)/start', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req) && (0, helpers_1.roleOf)(req) !== 'hr')
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can start a checklist');
        const n = await startOnboarding(Number(req.params.staffId), req);
        return (0, recordRouter_1.ok)(res, { created: n }, n ? 'Checklist started' : 'This person already has a checklist');
    }));
    r.post('/onboarding/:staffId(\\d+)/items', (0, recordRouter_1.wrap)(async (req, res) => {
        const staffId = Number(req.params.staffId);
        if (!canManageStaff(await manageableStaffIds(req), staffId))
            return (0, recordRouter_1.fail)(res, 403, 'Not allowed');
        const title = String(req.body?.title || '').trim().slice(0, 200);
        if (!title)
            return (0, recordRouter_1.fail)(res, 400, 'Write the step');
        const row = await models_1.ErpModels.OnboardingItem.create({
            staffId, title, section: String(req.body?.section || 'Extra steps').slice(0, 60), owner: String(req.body?.owner || 'HR').slice(0, 20),
            dueDate: req.body?.dueDate || null, sortOrder: 999,
        });
        return (0, recordRouter_1.ok)(res, row, 'Step added', 201);
    }));
    r.patch('/onboarding/items/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const item = await models_1.ErpModels.OnboardingItem.findByPk(req.params.id);
        if (!item)
            return (0, recordRouter_1.fail)(res, 404, 'Step not found');
        const manage = canManageStaff(await manageableStaffIds(req), Number(item.staffId));
        const own = (await myStaffId(req)) === Number(item.staffId) && item.owner === 'Staff';
        if (!manage && !own)
            return (0, recordRouter_1.fail)(res, 403, 'Only HR, the manager or (for your own steps) you can tick this');
        const done = req.body?.done !== false;
        await item.update({ doneAt: done ? new Date() : null, doneById: done ? (0, helpers_1.userId)(req) : null, doneByName: done ? (0, helpers_1.userName)(req) : null, ...(req.body?.note !== undefined && { note: String(req.body.note).slice(0, 1000) }) });
        (0, helpers_1.emitChange)(req, 'onboarding', 'updated', { id: item.staffId });
        const left = await one(`SELECT COUNT(*)::int v FROM erp_onboarding_items WHERE "staffId" = :s AND "doneAt" IS NULL`, { s: item.staffId });
        if (done && left === 0) {
            const s = (await q(`SELECT "userId", "firstName", "lastName" FROM staff WHERE id = :s`, { s: item.staffId }))[0];
            const { userIdsWithRoles } = require('./helpers');
            await (0, helpers_1.notifyUsers)(req, [...(await userIdsWithRoles(['hr'])), ...(s?.userId ? [Number(s.userId)] : [])], { title: 'Onboarding complete 🎉', message: `${s?.firstName} ${s?.lastName} has finished every onboarding step.`, type: 'System', actionUrl: `/hr/onboarding?staff=${item.staffId}` });
        }
        return (0, recordRouter_1.ok)(res, item, done ? 'Done' : 'Marked as not done');
    }));
    r.delete('/onboarding/items/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const item = await models_1.ErpModels.OnboardingItem.findByPk(req.params.id);
        if (!item)
            return (0, recordRouter_1.fail)(res, 404, 'Step not found');
        if (!canManageStaff(await manageableStaffIds(req), Number(item.staffId)))
            return (0, recordRouter_1.fail)(res, 403, 'Not allowed');
        await item.destroy();
        return (0, recordRouter_1.ok)(res, { id: item.id }, 'Step removed');
    }));
    r.get('/reviews/meta', (0, recordRouter_1.wrap)(async (_req, res) => (0, recordRouter_1.ok)(res, { criteria: exports.CRITERIA })));
    r.get('/reviews/people', (0, recordRouter_1.wrap)(async (req, res) => {
        const scope = await manageableStaffIds(req);
        const mine = await myStaffId(req);
        const rows = await q(`SELECT s.id, s."firstName", s."lastName", s.position, d.name AS department FROM staff s LEFT JOIN departments d ON d.id = s."departmentId"
       WHERE s."deletedAt" IS NULL AND COALESCE(s.status::text, 'Active') = 'Active' ORDER BY s."firstName", s."lastName"`);
        return (0, recordRouter_1.ok)(res, rows.filter((x) => Number(x.id) !== mine && canManageStaff(scope, Number(x.id))));
    }));
    r.get('/reviews', (0, recordRouter_1.wrap)(async (req, res) => {
        const scope = await manageableStaffIds(req);
        const mine = await myStaffId(req);
        const rows = await q(`SELECT r.id, r."staffId", r."periodLabel", r."periodStart", r."periodEnd", r.status, r."overallScore", r.rating, r."updatedAt",
              s."firstName", s."lastName", s.position, d.name AS department,
              NULLIF(TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')), '') AS "reviewerName"
       FROM erp_reviews r JOIN staff s ON s.id = r."staffId" LEFT JOIN departments d ON d.id = s."departmentId" LEFT JOIN users u ON u.id = r."reviewerUserId"
       ORDER BY r."periodEnd" DESC, r.id DESC`);
        return (0, recordRouter_1.ok)(res, {
            reviews: rows.filter((x) => canManageStaff(scope, Number(x.staffId)) || (Number(x.staffId) === mine && x.status !== 'Draft')),
            myStaffId: mine, canCreate: scope === 'all' || (Array.isArray(scope) && scope.length > 0),
        });
    }));
    r.post('/reviews', (0, recordRouter_1.wrap)(async (req, res) => {
        const scope = await manageableStaffIds(req);
        const b = req.body || {};
        const staffIds = (Array.isArray(b.staffIds) ? b.staffIds : [b.staffId]).map(Number).filter(Boolean);
        if (!staffIds.length || !b.periodStart || !b.periodEnd)
            return (0, recordRouter_1.fail)(res, 400, 'Choose who to review and the period');
        const mine = await myStaffId(req);
        const created = [];
        for (const staffId of staffIds) {
            if (!canManageStaff(scope, staffId))
                continue;
            if (staffId === mine)
                continue;
            const evidence = await buildEvidence(staffId, String(b.periodStart).slice(0, 10), String(b.periodEnd).slice(0, 10));
            const row = await models_1.ErpModels.Review.create({
                staffId, reviewerUserId: b.reviewerUserId ? Number(b.reviewerUserId) : (0, helpers_1.userId)(req), periodLabel: String(b.periodLabel || '').slice(0, 60) || `${b.periodStart} – ${b.periodEnd}`,
                periodStart: b.periodStart, periodEnd: b.periodEnd, status: b.sendForSelfReview ? 'Self review' : 'Draft', evidence, createdById: (0, helpers_1.userId)(req),
            });
            created.push(row);
            if (b.sendForSelfReview) {
                const s = (await q(`SELECT "userId" FROM staff WHERE id = :s`, { s: staffId }))[0];
                if (s?.userId)
                    await (0, helpers_1.notifyUsers)(req, [Number(s.userId)], { title: `Your ${row.periodLabel} review is ready`, message: 'Please score yourself and add your comments.', type: 'Approval', priority: 'High', actionUrl: `/hr/reviews?open=${row.id}` });
            }
        }
        if (!created.length)
            return (0, recordRouter_1.fail)(res, 403, 'You cannot review the selected people (you cannot review yourself)');
        await (0, helpers_1.audit)(req, 'HR', 'Create', 'Review', created[0].id, `${(0, helpers_1.userName)(req)} started ${created.length} performance review(s)`);
        (0, helpers_1.emitChange)(req, 'review', 'created');
        return (0, recordRouter_1.ok)(res, created, `${created.length} review(s) started`, 201);
    }));
    r.get('/reviews/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await reviewRow(Number(req.params.id));
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Review not found');
        const scope = await manageableStaffIds(req);
        const isMe = (await myStaffId(req)) === Number(row.staffId);
        if (!canManageStaff(scope, Number(row.staffId)) && !(isMe && row.status !== 'Draft'))
            return (0, recordRouter_1.fail)(res, 403, 'Not allowed');
        return (0, recordRouter_1.ok)(res, { ...row, criteria: exports.CRITERIA, canManage: canManageStaff(scope, Number(row.staffId)) && !isMe, isMe });
    }));
    r.post('/reviews/:id(\\d+)/refresh', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.Review.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Review not found');
        if (!canManageStaff(await manageableStaffIds(req), Number(row.staffId)))
            return (0, recordRouter_1.fail)(res, 403, 'Not allowed');
        await row.update({ evidence: await buildEvidence(Number(row.staffId), row.periodStart, row.periodEnd) });
        return (0, recordRouter_1.ok)(res, row, 'Work record refreshed');
    }));
    r.put('/reviews/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.Review.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Review not found');
        if (row.status === 'Completed' && !(0, helpers_1.isManagement)(req))
            return (0, recordRouter_1.fail)(res, 400, 'This review is completed');
        const b = req.body || {};
        const isMe = (await myStaffId(req)) === Number(row.staffId);
        const manage = canManageStaff(await manageableStaffIds(req), Number(row.staffId)) && !isMe;
        const scores = (v) => Object.fromEntries(exports.CRITERIA.map((c) => [c.key, Math.min(5, Math.max(0, Number(v?.[c.key]) || 0))]).filter(([, x]) => x));
        const staff = (await q(`SELECT "userId", "firstName", "lastName" FROM staff WHERE id = :s`, { s: row.staffId }))[0] || {};
        if (isMe) {
            if (row.status !== 'Self review')
                return (0, recordRouter_1.fail)(res, 400, 'Your self review is not open right now');
            await row.update({ selfScores: scores(b.selfScores), selfComment: String(b.selfComment || '').slice(0, 5000), ...(b.action === 'submit' && { status: 'Manager review' }) });
            if (b.action === 'submit' && row.reviewerUserId) {
                await (0, helpers_1.notifyUsers)(req, [Number(row.reviewerUserId)], { title: `${staff.firstName} finished their self review`, message: `${row.periodLabel} — ready for your scores.`, type: 'Approval', actionUrl: `/hr/reviews?open=${row.id}` });
            }
            return (0, recordRouter_1.ok)(res, row, b.action === 'submit' ? 'Sent to your manager' : 'Saved');
        }
        if (!manage)
            return (0, recordRouter_1.fail)(res, 403, 'Not allowed');
        const managerScores = b.managerScores !== undefined ? scores(b.managerScores) : row.managerScores;
        const vals = Object.values(managerScores || {}).map(Number).filter(Boolean);
        const overall = vals.length ? Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 100) / 100 : null;
        const patch = {
            managerScores, overallScore: overall, rating: overall ? RATING(overall) : null,
            ...(b.managerComment !== undefined && { managerComment: String(b.managerComment).slice(0, 5000) }),
            ...(Array.isArray(b.goals) && { goals: b.goals.map((g) => ({ goal: String(g.goal || '').slice(0, 300), due: g.due || null })).filter((g) => g.goal).slice(0, 10) }),
        };
        if (b.action === 'sendToStaff')
            patch.status = 'Self review';
        if (b.action === 'complete') {
            if (!overall)
                return (0, recordRouter_1.fail)(res, 400, 'Give a score for at least one area before completing');
            patch.status = 'Completed';
            patch.completedAt = new Date();
        }
        await row.update(patch);
        if (staff.userId && (b.action === 'sendToStaff' || b.action === 'complete')) {
            await (0, helpers_1.notifyUsers)(req, [Number(staff.userId)], b.action === 'complete'
                ? { title: `Your ${row.periodLabel} review is complete`, message: `Overall: ${patch.rating} (${overall}/5). Open it to read the feedback and your goals.`, type: 'System', actionUrl: `/hr/reviews?open=${row.id}` }
                : { title: `Your ${row.periodLabel} review is ready`, message: 'Please score yourself and add your comments.', type: 'Approval', priority: 'High', actionUrl: `/hr/reviews?open=${row.id}` });
        }
        await (0, helpers_1.audit)(req, 'HR', 'Update', 'Review', row.id, `${(0, helpers_1.userName)(req)} ${b.action === 'complete' ? 'completed' : 'updated'} the ${row.periodLabel} review of ${staff.firstName} ${staff.lastName}`);
        (0, helpers_1.emitChange)(req, 'review', 'updated', { id: row.id });
        return (0, recordRouter_1.ok)(res, row, b.action === 'complete' ? 'Review completed' : b.action === 'sendToStaff' ? 'Sent for self review' : 'Saved');
    }));
    r.delete('/reviews/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.Review.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Review not found');
        if (!(0, helpers_1.isManagement)(req) && (0, helpers_1.roleOf)(req) !== 'hr')
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can delete reviews');
        await row.destroy();
        return (0, recordRouter_1.ok)(res, { id: row.id }, 'Review deleted');
    }));
    return r;
}
//# sourceMappingURL=development.js.map