"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGES = void 0;
exports.recruitmentRouter = recruitmentRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const outbound_1 = require("./outbound");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
exports.STAGES = ['New', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected', 'Withdrawn'];
const FROM_STATUS = { Applied: 'New', Shortlisted: 'Shortlisted', Interviewed: 'Interview', Offered: 'Offer', Hired: 'Hired', Rejected: 'Rejected', Withdrawn: 'Withdrawn' };
const TO_STATUS = { New: 'Applied', Shortlisted: 'Shortlisted', Interview: 'Interviewed', Offer: 'Offered', Hired: 'Hired', Rejected: 'Rejected', Withdrawn: 'Withdrawn' };
const isHR = (req) => (0, helpers_1.isManagement)(req) || (0, helpers_1.roleOf)(req) === 'hr';
async function scope(req) {
    if (isHR(req))
        return { all: true, depts: [] };
    return { all: false, depts: await (0, helpers_1.headedDepartmentIds)((0, helpers_1.userId)(req)) };
}
async function loadApp(id) {
    return (await q(`SELECT a.id, a."jobPostingId", a."applicantName", a."applicantEmail", a."applicantPhone", a."resumeUrl", a."coverLetterUrl",
            a."applicationDate", a.status, a.source, a.notes, j.title AS "jobTitle", j."jobCode", j."departmentId", j."noOfPositions", j."jobType",
            j."salaryMin", j."salaryMax", j.currency AS "jobCurrency"
     FROM job_applications a JOIN job_postings j ON j.id = a."jobPostingId"
     WHERE a.id = :id AND a."deletedAt" IS NULL`, { id }))[0] || null;
}
async function candidateRow(appId) {
    const M = models_1.ErpModels.Candidate;
    let c = await M.findByPk(appId);
    if (!c) {
        const app = await loadApp(appId);
        c = await M.create({ applicationId: appId, stage: FROM_STATUS[app?.status] || 'New', timeline: [] });
    }
    return c;
}
const step = (c, req, action, note) => [...(c.timeline || []), { at: new Date().toISOString(), by: (0, helpers_1.userName)(req), byId: (0, helpers_1.userId)(req), action, note: note || null }];
async function setStage(app, c, req, stage, note, extra = {}) {
    await c.update({ stage, timeline: step(c, req, `Moved to ${stage}`, note), ...extra });
    await helpers_1.db.query(`UPDATE job_applications SET status = :s, "updatedAt" = NOW() WHERE id = :id`, { replacements: { s: TO_STATUS[stage], id: app.id } })
        .catch(async () => {
        await helpers_1.db.query(`UPDATE job_applications SET status = 'Offered', "updatedAt" = NOW() WHERE id = :id`, { replacements: { id: app.id } });
    });
}
async function canTouch(req, app) {
    const s = await scope(req);
    return s.all || s.depts.includes(Number(app.departmentId));
}
async function emailCandidate(app, subject, title, body) {
    const brand = await (0, outbound_1.brandForDepartment)(app.departmentId ? Number(app.departmentId) : null);
    return (0, outbound_1.sendBrandEmail)(brand, app.applicantEmail, subject, (0, outbound_1.brandEmailHtml)(brand, title, body));
}
function recruitmentRouter() {
    const r = (0, express_1.Router)();
    r.get('/recruitment', (0, recordRouter_1.wrap)(async (req, res) => {
        var _a;
        const s = await scope(req);
        if (!s.all && !s.depts.length)
            return (0, recordRouter_1.fail)(res, 403, 'Recruitment is for HR, management and heads of department');
        const deptFilter = s.all ? '' : `AND j."departmentId" IN (:depts)`;
        const jobs = await q(`SELECT j.id, j."jobCode", j.title, j.status, j."departmentId", d.name AS "departmentName", j."noOfPositions", j."closingDate", j."postedDate", j."jobType"
       FROM job_postings j LEFT JOIN departments d ON d.id = j."departmentId"
       WHERE j."deletedAt" IS NULL ${deptFilter} ORDER BY CASE j.status WHEN 'Open' THEN 0 WHEN 'OnHold' THEN 1 ELSE 2 END, j."postedDate" DESC`, { depts: s.depts.length ? s.depts : [0] });
        const apps = await q(`SELECT a.id, a."jobPostingId", a."applicantName", a."applicantEmail", a."applicantPhone", a."resumeUrl", a."applicationDate", a.status, a.source,
              c.stage, c.rating, c.interview, c.offer, c."hiredStaffId", c."updatedAt" AS "movedAt"
       FROM job_applications a JOIN job_postings j ON j.id = a."jobPostingId"
       LEFT JOIN erp_candidates c ON c."applicationId" = a.id
       WHERE a."deletedAt" IS NULL AND j."deletedAt" IS NULL ${deptFilter}
       ${req.query.jobId ? 'AND a."jobPostingId" = :job' : ''}
       ORDER BY a."applicationDate" DESC LIMIT 2000`, { depts: s.depts.length ? s.depts : [0], job: Number(req.query.jobId) || 0 });
        const candidates = apps.map((a) => {
            const fb = (a.interview?.feedback || []);
            return {
                ...a, id: Number(a.id), jobPostingId: Number(a.jobPostingId), stage: a.stage || FROM_STATUS[a.status] || 'New',
                interviewAt: a.interview?.at || null, feedbackCount: fb.length,
                avgScore: fb.length ? Math.round((fb.reduce((t, f) => t + Number(f.rating || 0), 0) / fb.length) * 10) / 10 : null,
            };
        });
        const counts = {};
        for (const c of candidates) {
            (counts[_a = c.jobPostingId] || (counts[_a] = {}));
            counts[c.jobPostingId][c.stage] = (counts[c.jobPostingId][c.stage] || 0) + 1;
        }
        return (0, recordRouter_1.ok)(res, { stages: exports.STAGES, jobs: jobs.map((j) => ({ ...j, id: Number(j.id), counts: counts[Number(j.id)] || {} })), candidates, canHire: isHR(req) });
    }));
    r.get('/recruitment/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        const app = await loadApp(Number(req.params.id));
        if (!app)
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        if (!(await canTouch(req, app)))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot see this applicant');
        const c = await candidateRow(Number(app.id));
        const interviewerIds = c.interview?.interviewerIds || [];
        const interviewers = interviewerIds.length ? await q(`SELECT id, COALESCE(NULLIF(TRIM(CONCAT("firstName", ' ', "lastName")), ''), email) AS name FROM users WHERE id IN (:ids)`, { ids: interviewerIds }) : [];
        const other = await q(`SELECT a.id, j.title AS "jobTitle", a.status, a."applicationDate" FROM job_applications a JOIN job_postings j ON j.id = a."jobPostingId"
       WHERE LOWER(a."applicantEmail") = LOWER(:e) AND a.id <> :id AND a."deletedAt" IS NULL ORDER BY a."applicationDate" DESC`, { e: app.applicantEmail, id: app.id });
        return (0, recordRouter_1.ok)(res, { ...app, ...c.get({ plain: true }), interviewers, otherApplications: other, canHire: isHR(req) });
    }));
    r.post('/recruitment', (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        const job = (await q(`SELECT id, "departmentId", title, "jobCode" FROM job_postings WHERE id = :id AND "deletedAt" IS NULL`, { id: Number(b.jobPostingId) || 0 }))[0];
        if (!job)
            return (0, recordRouter_1.fail)(res, 400, 'Choose the job');
        if (!(await canTouch(req, { departmentId: job.departmentId })))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot add applicants to this job');
        const name = String(b.name || '').trim().slice(0, 150);
        const email = String(b.email || '').trim().toLowerCase().slice(0, 100);
        const phone = String(b.phone || '').trim().slice(0, 20);
        if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
            return (0, recordRouter_1.fail)(res, 400, 'Enter the name and a valid email');
        const dup = await q(`SELECT id FROM job_applications WHERE "jobPostingId" = :j AND LOWER("applicantEmail") = :e AND "deletedAt" IS NULL`, { j: job.id, e: email });
        if (dup[0])
            return (0, recordRouter_1.fail)(res, 409, 'This person has already applied for this job');
        const [first, ...rest] = name.split(' ');
        let contact = await q(`SELECT id FROM contacts WHERE LOWER(email) = :e AND "deletedAt" IS NULL LIMIT 1`, { e: email });
        if (!contact[0]) {
            contact = await q(`INSERT INTO contacts (uuid, "contactCode", "firstName", "lastName", email, phone, source, status, notes, "createdAt", "updatedAt")
         VALUES (:uuid, :code, :f, :l, :e, :p, 'Referral', 'Lead', 'Job applicant (added by HR)', NOW(), NOW()) RETURNING id`, { uuid: (0, uuid_1.v4)(), code: `APP-${Date.now().toString(36).toUpperCase()}`, f: first, l: rest.join(' ') || '-', e: email, p: phone || '-' });
        }
        const rows = await q(`INSERT INTO job_applications (uuid, "jobPostingId", "contactId", "applicantName", "applicantEmail", "applicantPhone", "resumeUrl", "applicationDate", status, source, notes, "createdAt", "updatedAt")
       VALUES (:uuid, :j, :c, :n, :e, :p, :r, NOW(), 'Applied', :src, :notes, NOW(), NOW()) RETURNING id`, { uuid: (0, uuid_1.v4)(), j: job.id, c: contact[0].id, n: name, e: email, p: phone || '-', r: b.resumeUrl || null, src: String(b.source || 'Added by HR').slice(0, 100), notes: b.notes ? String(b.notes).slice(0, 5000) : null });
        const id = Number(rows[0].id);
        await models_1.ErpModels.Candidate.create({ applicationId: id, stage: 'New', timeline: [{ at: new Date().toISOString(), by: (0, helpers_1.userName)(req), byId: (0, helpers_1.userId)(req), action: `Added (${b.source || 'by hand'})`, note: null }] });
        await (0, helpers_1.audit)(req, 'Recruitment', 'Create', 'Applicant', id, `${(0, helpers_1.userName)(req)} added ${name} for ${job.title}`);
        (0, helpers_1.emitChange)(req, 'job_application', 'created', { id });
        return (0, recordRouter_1.ok)(res, { id }, 'Applicant added', 201);
    }));
    r.post('/recruitment/:id(\\d+)/stage', (0, recordRouter_1.wrap)(async (req, res) => {
        const app = await loadApp(Number(req.params.id));
        if (!app)
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        if (!(await canTouch(req, app)))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot move this applicant');
        const stage = String(req.body?.stage || '');
        if (!exports.STAGES.includes(stage) || stage === 'Hired')
            return (0, recordRouter_1.fail)(res, 400, stage === 'Hired' ? 'Use “Hire” to take someone on' : 'Unknown stage');
        const note = req.body?.note ? String(req.body.note).slice(0, 2000) : null;
        const c = await candidateRow(Number(app.id));
        await setStage(app, c, req, stage, note, stage === 'Rejected' ? { rejectReason: note } : {});
        let emailed = false;
        if (req.body?.notifyCandidate) {
            const first = (0, outbound_1.escapeHtml)(String(app.applicantName).split(' ')[0]);
            if (stage === 'Rejected') {
                emailed = (await emailCandidate(app, `Your application for ${app.jobTitle}`, 'Thank you for applying', `<p>Dear ${first},</p><p>Thank you for your interest in the <b>${(0, outbound_1.escapeHtml)(app.jobTitle)}</b> role and for the time you put into your application.</p>
           <p>After careful consideration we will not be taking your application further at this time. We will keep your details and may contact you about future openings.</p>
           <p>We wish you every success.</p>`)).ok;
            }
            else if (stage === 'Shortlisted') {
                emailed = (await emailCandidate(app, `Your application for ${app.jobTitle}`, 'You have been shortlisted', `<p>Dear ${first},</p><p>Good news — your application for <b>${(0, outbound_1.escapeHtml)(app.jobTitle)}</b> has been shortlisted. We will be in touch shortly about the next step.</p>`)).ok;
            }
        }
        await (0, helpers_1.audit)(req, 'Recruitment', 'Update', 'Applicant', app.id, `${(0, helpers_1.userName)(req)} moved ${app.applicantName} to ${stage}`, { note });
        (0, helpers_1.emitChange)(req, 'job_application', 'updated', { id: app.id });
        return (0, recordRouter_1.ok)(res, { stage, emailed }, emailed ? `Moved to ${stage} and emailed the applicant` : `Moved to ${stage}`);
    }));
    r.post('/recruitment/:id(\\d+)/rating', (0, recordRouter_1.wrap)(async (req, res) => {
        const app = await loadApp(Number(req.params.id));
        if (!app || !(await canTouch(req, app)))
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        const c = await candidateRow(Number(app.id));
        await c.update({ rating: Math.min(5, Math.max(1, (0, helpers_1.toNum)(req.body?.rating, 3))) });
        return (0, recordRouter_1.ok)(res, { rating: c.rating }, 'Rating saved');
    }));
    r.post('/recruitment/:id(\\d+)/interview', (0, recordRouter_1.wrap)(async (req, res) => {
        const app = await loadApp(Number(req.params.id));
        if (!app)
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        if (!(await canTouch(req, app)))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot schedule this interview');
        const b = req.body || {};
        const at = b.at ? new Date(b.at) : null;
        if (!at || isNaN(at.getTime()))
            return (0, recordRouter_1.fail)(res, 400, 'Choose the interview date and time');
        const mode = ['In person', 'Video call', 'Phone call'].includes(b.mode) ? b.mode : 'In person';
        const interviewerIds = Array.isArray(b.interviewerIds) ? [...new Set(b.interviewerIds.map(Number).filter(Boolean))] : [];
        const c = await candidateRow(Number(app.id));
        const interview = { ...(c.interview || {}), at: at.toISOString(), mode, place: b.place ? String(b.place).slice(0, 300) : null, interviewerIds, feedback: c.interview?.feedback || [] };
        await setStage(app, c, req, 'Interview', `${mode} on ${at.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })}`, { interview });
        try {
            const { CalendarEvent } = require('../models/CalendarEvent.model');
            await CalendarEvent.create({ uuid: (0, uuid_1.v4)(), title: `Interview: ${app.applicantName} (${app.jobTitle})`, date: at, endDate: new Date(at.getTime() + 45 * 60000), type: 'Meeting', description: `${mode}${interview.place ? ` — ${interview.place}` : ''}`, createdById: (0, helpers_1.userId)(req) });
        }
        catch (e) {
            console.error('[recruitment] calendar entry failed:', e.message);
        }
        await (0, helpers_1.notifyUsers)(req, interviewerIds, {
            title: 'You are on an interview panel', type: 'Reminder',
            message: `${app.applicantName} for ${app.jobTitle} — ${at.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })} (${mode}).`,
            actionUrl: `/hr/recruitment?open=${app.id}`,
        }, { excludeSelf: (0, helpers_1.userId)(req) });
        let emailed = false;
        if (b.notifyCandidate) {
            emailed = (await emailCandidate(app, `Interview invitation — ${app.jobTitle}`, 'Interview invitation', `<p>Dear ${(0, outbound_1.escapeHtml)(String(app.applicantName).split(' ')[0])},</p>
         <p>Thank you for applying for <b>${(0, outbound_1.escapeHtml)(app.jobTitle)}</b>. We would like to invite you to an interview:</p>
         <p><b>When:</b> ${at.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', dateStyle: 'full', timeStyle: 'short' })} (Lagos time)<br/>
         <b>How:</b> ${(0, outbound_1.escapeHtml)(mode)}${interview.place ? `<br/><b>${mode === 'In person' ? 'Where' : 'Link / details'}:</b> ${(0, outbound_1.escapeHtml)(interview.place)}` : ''}</p>
         <p>Please reply to confirm you can attend.</p>`)).ok;
        }
        await (0, helpers_1.audit)(req, 'Recruitment', 'Update', 'Applicant', app.id, `${(0, helpers_1.userName)(req)} scheduled an interview for ${app.applicantName}`);
        (0, helpers_1.emitChange)(req, 'job_application', 'updated', { id: app.id });
        return (0, recordRouter_1.ok)(res, { interview, emailed }, emailed ? 'Interview booked and the applicant emailed' : 'Interview booked');
    }));
    r.post('/recruitment/:id(\\d+)/feedback', (0, recordRouter_1.wrap)(async (req, res) => {
        const app = await loadApp(Number(req.params.id));
        if (!app)
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        const c = await candidateRow(Number(app.id));
        const onPanel = (c.interview?.interviewerIds || []).map(Number).includes((0, helpers_1.userId)(req));
        if (!onPanel && !(await canTouch(req, app)))
            return (0, recordRouter_1.fail)(res, 403, 'Only the interview panel, HR or the head of department can give feedback');
        const rating = Math.min(5, Math.max(1, (0, helpers_1.toNum)(req.body?.rating, 3)));
        const recommendation = ['Hire', 'Maybe', 'Do not hire'].includes(req.body?.recommendation) ? req.body.recommendation : 'Maybe';
        const note = req.body?.note ? String(req.body.note).slice(0, 3000) : null;
        const feedback = [...(c.interview?.feedback || []).filter((f) => Number(f.byId) !== (0, helpers_1.userId)(req)), { by: (0, helpers_1.userName)(req), byId: (0, helpers_1.userId)(req), rating, recommendation, note, at: new Date().toISOString() }];
        await c.update({ interview: { ...(c.interview || {}), feedback }, timeline: step(c, req, `Interview feedback: ${recommendation} (${rating}/5)`, note) });
        (0, helpers_1.emitChange)(req, 'job_application', 'updated', { id: app.id });
        return (0, recordRouter_1.ok)(res, { feedback }, 'Feedback saved');
    }));
    r.post('/recruitment/:id(\\d+)/offer', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can make offers');
        const app = await loadApp(Number(req.params.id));
        if (!app)
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        const b = req.body || {};
        const offer = {
            position: String(b.position || app.jobTitle).slice(0, 120), departmentId: Number(b.departmentId) || Number(app.departmentId),
            salary: Math.max(0, (0, helpers_1.toNum)(b.salary)), currency: String(b.currency || 'NGN').toUpperCase().slice(0, 3),
            startDate: b.startDate || null, employmentStatus: b.employmentStatus || 'Full-Time', notes: b.notes ? String(b.notes).slice(0, 2000) : null,
            sentAt: new Date().toISOString(), response: 'Waiting',
        };
        const c = await candidateRow(Number(app.id));
        await setStage(app, c, req, 'Offer', `${offer.position}${offer.salary ? ` — ${offer.currency} ${offer.salary.toLocaleString()} a month` : ''}`, { offer });
        let emailed = false;
        if (b.notifyCandidate) {
            emailed = (await emailCandidate(app, `Offer of employment — ${offer.position}`, 'Offer of employment', `<p>Dear ${(0, outbound_1.escapeHtml)(String(app.applicantName).split(' ')[0])},</p>
         <p>We are pleased to offer you the position of <b>${(0, outbound_1.escapeHtml)(offer.position)}</b>.</p>
         <p>${offer.salary ? `<b>Monthly pay:</b> ${offer.currency} ${offer.salary.toLocaleString('en-NG')}<br/>` : ''}${offer.startDate ? `<b>Start date:</b> ${new Date(offer.startDate).toLocaleDateString('en-GB', { dateStyle: 'long' })}<br/>` : ''}<b>Type:</b> ${(0, outbound_1.escapeHtml)(offer.employmentStatus)}</p>
         ${offer.notes ? `<p>${(0, outbound_1.escapeHtml)(offer.notes)}</p>` : ''}
         <p>Please reply to this email to accept the offer. We look forward to welcoming you.</p>`)).ok;
        }
        await (0, helpers_1.audit)(req, 'Recruitment', 'Update', 'Applicant', app.id, `${(0, helpers_1.userName)(req)} made an offer to ${app.applicantName}`, offer);
        (0, helpers_1.emitChange)(req, 'job_application', 'updated', { id: app.id });
        return (0, recordRouter_1.ok)(res, { offer, emailed }, emailed ? 'Offer saved and emailed' : 'Offer saved');
    }));
    r.post('/recruitment/:id(\\d+)/offer-response', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can update offers');
        const app = await loadApp(Number(req.params.id));
        if (!app)
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        const c = await candidateRow(Number(app.id));
        const response = ['Accepted', 'Declined', 'Waiting'].includes(req.body?.response) ? req.body.response : 'Waiting';
        await c.update({ offer: { ...(c.offer || {}), response }, timeline: step(c, req, `Offer ${response.toLowerCase()}`) });
        if (response === 'Declined')
            await setStage(app, c, req, 'Withdrawn', 'Declined the offer');
        (0, helpers_1.emitChange)(req, 'job_application', 'updated', { id: app.id });
        return (0, recordRouter_1.ok)(res, { response }, `Offer marked ${response.toLowerCase()}`);
    }));
    r.post('/recruitment/:id(\\d+)/hire', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can hire');
        const app = await loadApp(Number(req.params.id));
        if (!app)
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        const c = await candidateRow(Number(app.id));
        if (c.hiredStaffId)
            return (0, recordRouter_1.fail)(res, 409, 'This person has already been hired');
        const b = req.body || {};
        const offer = c.offer || {};
        if (!b.dateOfBirth)
            return (0, recordRouter_1.fail)(res, 400, 'Enter their date of birth (needed for the staff record and birthday wishes)');
        const startDate = b.startDate || offer.startDate || new Date().toISOString().slice(0, 10);
        const [firstName, ...rest] = String(b.fullName || app.applicantName).trim().split(/\s+/);
        const body = {
            firstName, lastName: rest.join(' ') || '-', email: String(b.email || app.applicantEmail).toLowerCase(), phone: b.phone || app.applicantPhone,
            departmentId: Number(b.departmentId) || offer.departmentId || Number(app.departmentId), position: b.position || offer.position || app.jobTitle,
            jobTitle: b.position || offer.position || app.jobTitle, joiningDate: startDate, hireDate: startDate, dateOfBirth: b.dateOfBirth,
            gender: b.gender || undefined, employmentStatus: b.employmentStatus || offer.employmentStatus || 'Full-Time',
            basicSalary: (0, helpers_1.toNum)(b.salary, (0, helpers_1.toNum)(offer.salary)), salaryCurrency: b.currency || offer.currency || 'NGN',
        };
        const port = process.env.PORT || 3000;
        const resp = await fetch(`http://127.0.0.1:${port}/api/staff`, {
            method: 'POST', headers: { Authorization: String(req.headers.authorization || ''), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const out = await resp.json().catch(() => ({}));
        if (!resp.ok || out?.success === false)
            return (0, recordRouter_1.fail)(res, resp.status >= 400 ? resp.status : 400, out?.message || 'Could not create the staff account');
        const staffId = Number(out.data?.id);
        await setStage(app, c, req, 'Hired', `Staff account created (${body.position})`, { hiredStaffId: staffId, offer: { ...offer, response: 'Accepted' } });
        const hired = await q(`SELECT COUNT(*)::int n FROM erp_candidates c JOIN job_applications a ON a.id = c."applicationId" WHERE a."jobPostingId" = :j AND c.stage = 'Hired'`, { j: app.jobPostingId });
        let filled = false;
        if (Number(hired[0]?.n || 0) >= Number(app.noOfPositions || 1)) {
            await helpers_1.db.query(`UPDATE job_postings SET status = 'Filled', "updatedAt" = NOW() WHERE id = :j`, { replacements: { j: app.jobPostingId } }).catch(() => null);
            filled = true;
        }
        await (0, helpers_1.notifyUsers)(req, await (0, helpers_1.userIdsWithRoles)(['hr', 'admin', 'superadmin']), {
            title: 'New hire', type: 'System', message: `${app.applicantName} has been hired as ${body.position}. Their login and onboarding checklist are ready.`,
            actionUrl: `/hr/onboarding?staff=${staffId}`,
        }, { excludeSelf: (0, helpers_1.userId)(req) });
        await (0, helpers_1.audit)(req, 'Recruitment', 'Hire', 'Applicant', app.id, `${(0, helpers_1.userName)(req)} hired ${app.applicantName} as ${body.position}`);
        (0, helpers_1.emitChange)(req, 'job_application', 'updated', { id: app.id });
        return (0, recordRouter_1.ok)(res, { staffId, filled }, `${firstName} is hired — welcome email sent and onboarding started${filled ? '. The job advert is now marked Filled' : ''}`);
    }));
    r.post('/recruitment/:id(\\d+)/note', (0, recordRouter_1.wrap)(async (req, res) => {
        const app = await loadApp(Number(req.params.id));
        if (!app || !(await canTouch(req, app)))
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        const note = String(req.body?.note || '').trim().slice(0, 3000);
        if (!note)
            return (0, recordRouter_1.fail)(res, 400, 'Write a note');
        const c = await candidateRow(Number(app.id));
        await c.update({ timeline: step(c, req, 'Note', note) });
        return (0, recordRouter_1.ok)(res, null, 'Note added');
    }));
    r.delete('/recruitment/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!isHR(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only HR and management can remove applicants');
        const app = await loadApp(Number(req.params.id));
        if (!app)
            return (0, recordRouter_1.fail)(res, 404, 'Applicant not found');
        await helpers_1.db.query(`UPDATE job_applications SET "deletedAt" = NOW() WHERE id = :id`, { replacements: { id: app.id } });
        await (0, helpers_1.audit)(req, 'Recruitment', 'Delete', 'Applicant', app.id, `${(0, helpers_1.userName)(req)} removed applicant ${app.applicantName}`);
        (0, helpers_1.emitChange)(req, 'job_application', 'deleted', { id: app.id });
        return (0, recordRouter_1.ok)(res, { id: app.id }, 'Applicant removed');
    }));
    return r;
}
//# sourceMappingURL=recruitment.js.map