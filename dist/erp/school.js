"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolRouter = schoolRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
const outbound_1 = require("./outbound");
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const ACTIVE_ENR = ['Enrolled', 'InProgress', 'OnHold'];
const ACTIVE_SE = ['Active', 'Pending'];
function perms(req) { return new Set((req.user?.permissions || []).map((p) => String(p).toLowerCase())); }
function canManageSchool(req) {
    if ((0, helpers_1.isManagement)(req) || ['hr', 'hod'].includes((0, helpers_1.roleOf)(req)))
        return true;
    const p = perms(req);
    return ['stm.student.update.all', 'stm.student.update.own_department', 'lms.certificate.issue.all', 'lms.certificate.issue.own_department', 'lms.enrollment.create.all'].some((x) => p.has(x));
}
async function schoolDepts(school) {
    const { schoolDepartmentIds } = require('../utils/school');
    const ids = await schoolDepartmentIds(school);
    if (!ids?.length)
        return [0];
    const kids = await q(`SELECT id FROM departments WHERE "parentDepartmentId" IN (:ids) AND "deletedAt" IS NULL`, { ids });
    return [...new Set([...ids, ...kids.map((k) => Number(k.id))])];
}
async function enrolmentsFor(studentIds) {
    if (!studentIds.length)
        return [];
    const a = await q(`SELECT 'E' AS src, e.id, e."studentId", e."courseId", c.title, c."courseCode", e.status::text AS status, COALESCE(e."progressPercentage", 0)::int AS progress,
            e."enrollmentDate" AS "startedAt", e."completionDate" AS "completedAt",
            (SELECT "certificateCode" FROM certificates ce WHERE ce."enrollmentId" = e.id AND ce."deletedAt" IS NULL AND COALESCE(ce.status::text, 'Issued') = 'Issued' LIMIT 1) AS "certificateCode"
     FROM enrollments e JOIN courses c ON c.id = e."courseId" WHERE e."studentId" IN (:ids) AND e."deletedAt" IS NULL`, { ids: studentIds }).catch(() => []);
    const b = await q(`SELECT 'S' AS src, se.id, se."studentId", se."courseId", c.title, c."courseCode", se.status::text AS status, COALESCE(se."progressPercentage", 0)::int AS progress,
            se."enrolledAt" AS "startedAt", se."completedAt", CASE WHEN se."isCertificateIssued" THEN 'issued' END AS "certificateCode"
     FROM student_enrollments se JOIN courses c ON c.id = se."courseId" WHERE se."studentId" IN (:ids)`, { ids: studentIds }).catch(() => []);
    const seen = new Set(a.map((r) => `${r.studentId}:${r.courseId}`));
    return [...a, ...b.filter((r) => !seen.has(`${r.studentId}:${r.courseId}`))].map((r) => ({ ...r, id: Number(r.id), studentId: Number(r.studentId), courseId: Number(r.courseId) }));
}
async function lessonProgress(studentIds) {
    if (!studentIds.length)
        return new Map();
    const rows = await q(`SELECT p."studentId", p."courseId", COUNT(*) FILTER (WHERE p."completedAt" IS NOT NULL)::int done,
            (SELECT COUNT(*)::int FROM erp_lessons l WHERE l."courseId" = p."courseId" AND l.status = 'Published') total
     FROM erp_lesson_progress p WHERE p."studentId" IN (:ids) GROUP BY p."studentId", p."courseId"`, { ids: studentIds }).catch(() => []);
    return new Map(rows.map((r) => [`${r.studentId}:${r.courseId}`, r.total ? Math.round((r.done / r.total) * 100) : 0]));
}
const isActive = (e) => (e.src === 'E' ? ACTIVE_ENR : ACTIVE_SE).includes(e.status);
const isDone = (e) => e.status === 'Completed';
function schoolRouter() {
    const r = (0, express_1.Router)();
    r.get('/school/students', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!canManageSchool(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only school staff can see students');
        const school = String(req.query.school || 'KS').toUpperCase() === 'BM' ? 'BM' : 'KS';
        const depts = await schoolDepts(school);
        const rows = await q(`SELECT sp.id, sp."studentNumber", sp.status::text AS status, sp."departmentId", sp."enrollmentDate", sp."graduationDate", sp."expectedGraduationDate", sp."createdAt",
              sp."guardianName", sp."guardianPhone", sp."guardianEmail", sp."companyId", u.id AS "userId", u."firstName", u."lastName", u.email, u.phone, d.name AS "departmentName"
       FROM student_profiles sp JOIN users u ON u.id = sp."userId" LEFT JOIN departments d ON d.id = sp."departmentId"
       WHERE sp."departmentId" IN (:depts) OR sp.id IN (
         SELECT e."studentId" FROM enrollments e JOIN courses c ON c.id = e."courseId" WHERE c."departmentId" IN (:depts) AND e."deletedAt" IS NULL
         UNION SELECT se."studentId" FROM student_enrollments se JOIN courses c ON c.id = se."courseId" WHERE c."departmentId" IN (:depts))
       ORDER BY u."firstName", u."lastName"`, { depts });
        const ids = rows.map((s) => Number(s.id));
        const enr = await enrolmentsFor(ids);
        const lp = await lessonProgress(ids);
        const out = rows.map((s) => {
            const courses = enr.filter((e) => e.studentId === Number(s.id)).map((e) => ({ ...e, lessonPercent: lp.get(`${e.studentId}:${e.courseId}`) ?? null }));
            const active = courses.filter(isActive);
            const ready = active.length > 0 && active.every((c) => Math.max(c.progress, c.lessonPercent ?? 0) >= 100);
            return {
                ...s, id: Number(s.id), userId: Number(s.userId), name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.email,
                courses, activeCourses: active.length, completedCourses: courses.filter(isDone).length,
                certificates: courses.filter((c) => c.certificateCode).length, readyToGraduate: s.status === 'Active' && ready,
            };
        });
        const counts = { all: out.length, Active: 0, Graduated: 0, Suspended: 0, Withdrawn: 0, Inactive: 0, ready: out.filter((s) => s.readyToGraduate).length };
        out.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + 1; });
        return (0, recordRouter_1.ok)(res, { school, students: out, counts });
    }));
    r.get('/school/courses', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!canManageSchool(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only school staff can see this');
        const school = String(req.query.school || 'KS').toUpperCase() === 'BM' ? 'BM' : 'KS';
        const depts = await schoolDepts(school);
        const courses = await q(`SELECT c.id, c."courseCode", c.title, c.description, c.status::text AS status, c."instructorName", c.duration, c.fee, c."startDate", c."endDate", c."certificateRequired", d.name AS "departmentName"
       FROM courses c LEFT JOIN departments d ON d.id = c."departmentId" WHERE c."deletedAt" IS NULL AND c."departmentId" IN (:depts) ORDER BY c."startDate" DESC NULLS LAST, c.title`, { depts });
        const ids = courses.map((c) => Number(c.id));
        const stats = ids.length ? await q(`SELECT "courseId", COUNT(*)::int total, COUNT(*) FILTER (WHERE status IN ('Completed'))::int completed, COUNT(*) FILTER (WHERE status IN ('Enrolled','InProgress','OnHold','Active','Pending'))::int active,
              AVG(progress)::int avg
       FROM (SELECT "courseId", status::text status, COALESCE("progressPercentage",0) progress FROM enrollments WHERE "courseId" IN (:ids) AND "deletedAt" IS NULL AND "studentId" IS NOT NULL
             UNION ALL SELECT "courseId", status::text, COALESCE("progressPercentage",0) FROM student_enrollments WHERE "courseId" IN (:ids)) x GROUP BY "courseId"`, { ids }) : [];
        const lessons = ids.length ? await q(`SELECT "courseId", COUNT(*) FILTER (WHERE status = 'Published')::int pub, COUNT(*)::int total FROM erp_lessons WHERE "courseId" IN (:ids) GROUP BY "courseId"`, { ids }).catch(() => []) : [];
        const certs = ids.length ? await q(`SELECT e."courseId", COUNT(*)::int n FROM certificates ce JOIN enrollments e ON e.id = ce."enrollmentId" WHERE e."courseId" IN (:ids) AND ce."deletedAt" IS NULL GROUP BY e."courseId"`, { ids }).catch(() => []) : [];
        const sm = new Map(stats.map((s) => [Number(s.courseId), s]));
        const lm = new Map(lessons.map((s) => [Number(s.courseId), s]));
        const cm = new Map(certs.map((s) => [Number(s.courseId), Number(s.n)]));
        return (0, recordRouter_1.ok)(res, courses.map((c) => ({
            ...c, id: Number(c.id), fee: c.fee != null ? Number(c.fee) : null,
            students: Number(sm.get(Number(c.id))?.total || 0), active: Number(sm.get(Number(c.id))?.active || 0), completed: Number(sm.get(Number(c.id))?.completed || 0),
            avgProgress: sm.get(Number(c.id))?.avg ?? 0, lessons: Number(lm.get(Number(c.id))?.pub || 0), draftLessons: Number(lm.get(Number(c.id))?.total || 0) - Number(lm.get(Number(c.id))?.pub || 0),
            certificates: cm.get(Number(c.id)) || 0,
        })));
    }));
    r.post('/school/graduate', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!canManageSchool(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only school staff can graduate students');
        const b = req.body || {};
        const studentIds = [...new Set((Array.isArray(b.studentIds) ? b.studentIds : []).map(Number).filter(Boolean))];
        if (!studentIds.length)
            return (0, recordRouter_1.fail)(res, 400, 'Choose at least one student');
        const onlyCourses = Array.isArray(b.courseIds) && b.courseIds.length ? b.courseIds.map(Number) : null;
        const when = /^\d{4}-\d{2}-\d{2}$/.test(String(b.graduationDate || '')) ? String(b.graduationDate) : new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
        const issue = b.issueCertificates !== false;
        const notify = b.notify !== false;
        const enr = await enrolmentsFor(studentIds);
        const results = [];
        for (const sid of studentIds) {
            const sp = (await q(`SELECT sp.*, u."firstName", u."lastName", u.email FROM student_profiles sp JOIN users u ON u.id = sp."userId" WHERE sp.id = :id`, { id: sid }))[0];
            if (!sp) {
                results.push({ studentId: sid, ok: false, error: 'Student not found' });
                continue;
            }
            const mine = enr.filter((e) => e.studentId === sid && (onlyCourses ? onlyCourses.includes(e.courseId) : isActive(e) || isDone(e)));
            const done = [];
            for (const e of mine) {
                if (e.src === 'E') {
                    if (!isDone(e))
                        await helpers_1.db.query(`UPDATE enrollments SET status = 'Completed', "completionDate" = :d, "progressPercentage" = 100, "updatedAt" = NOW() WHERE id = :id`, { replacements: { d: when, id: e.id } });
                    let code = e.certificateCode;
                    if (issue && !code) {
                        code = `CERT-${e.courseCode || 'C'}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
                        await helpers_1.db.query(`INSERT INTO certificates (uuid, "enrollmentId", "certificateCode", "certificateName", "issuedDate", "verificationCode", status, "createdAt", "updatedAt")
               VALUES (:u, :e, :c, :n, :d, :v, 'Issued', NOW(), NOW())`, { replacements: { u: (0, uuid_1.v4)(), e: e.id, c: code, n: `Certificate of Completion — ${e.title}`, d: when, v: (0, uuid_1.v4)().slice(0, 8).toUpperCase() } });
                    }
                    await helpers_1.db.query(`UPDATE student_enrollments SET status = 'Completed', "completedAt" = COALESCE("completedAt", :d), "progressPercentage" = 100,
            "isCertificateIssued" = "isCertificateIssued" OR :ci, "certificateIssuedAt" = CASE WHEN :ci THEN COALESCE("certificateIssuedAt", NOW()) ELSE "certificateIssuedAt" END, "updatedAt" = NOW()
            WHERE "studentId" = :s AND "courseId" = :c`, { replacements: { d: when, ci: issue, s: sid, c: e.courseId } }).catch(() => null);
                    done.push({ course: e.title, certificateCode: code || null });
                }
                else {
                    await helpers_1.db.query(`UPDATE student_enrollments SET status = 'Completed', "completedAt" = COALESCE("completedAt", :d), "progressPercentage" = 100,
            "isCertificateIssued" = "isCertificateIssued" OR :ci, "certificateIssuedAt" = CASE WHEN :ci THEN COALESCE("certificateIssuedAt", NOW()) ELSE "certificateIssuedAt" END, "updatedAt" = NOW() WHERE id = :id`, { replacements: { d: when, ci: issue, id: e.id } });
                    let certCode = null;
                    if (issue) {
                        const rows = await q(`SELECT id FROM enrollments WHERE "studentId" = :s AND "courseId" = :c AND "deletedAt" IS NULL LIMIT 1`, { s: sid, c: e.courseId });
                        let enrId = rows[0]?.id;
                        if (!enrId) {
                            enrId = (await q(`INSERT INTO enrollments (uuid, "courseId", "studentId", "enrollmentDate", "completionDate", status, "progressPercentage", "createdAt", "updatedAt")
                VALUES (:u, :c, :s, COALESCE(:st, NOW()), :d, 'Completed', 100, NOW(), NOW()) RETURNING id`, { u: (0, uuid_1.v4)(), c: e.courseId, s: sid, st: e.startedAt || null, d: when }))[0].id;
                        }
                        const has = (await q(`SELECT "certificateCode" FROM certificates WHERE "enrollmentId" = :e AND "deletedAt" IS NULL LIMIT 1`, { e: enrId }))[0];
                        certCode = has?.certificateCode || `CERT-${e.courseCode || 'C'}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
                        if (!has)
                            await helpers_1.db.query(`INSERT INTO certificates (uuid, "enrollmentId", "certificateCode", "certificateName", "issuedDate", "verificationCode", status, "createdAt", "updatedAt")
              VALUES (:u, :e, :c, :n, :d, :v, 'Issued', NOW(), NOW())`, { replacements: { u: (0, uuid_1.v4)(), e: enrId, c: certCode, n: `Certificate of Completion — ${e.title}`, d: when, v: (0, uuid_1.v4)().slice(0, 8).toUpperCase() } });
                    }
                    done.push({ course: e.title, certificateCode: certCode });
                }
            }
            const after = await enrolmentsFor([sid]);
            const stillActive = after.filter(isActive).length;
            const graduate = b.graduateProgramme === true || stillActive === 0;
            if (graduate) {
                await helpers_1.db.query(`UPDATE student_profiles SET status = 'Graduated', "graduationDate" = :d, "updatedAt" = NOW() WHERE id = :id`, { replacements: { d: when, id: sid } });
            }
            if (notify) {
                const courseList = done.map((d) => d.course).join(', ') || 'your course';
                await (0, helpers_1.notifyUsers)(req, [Number(sp.userId)], { title: graduate ? '🎓 Congratulations, graduate!' : 'Course completed 🎉', type: 'Other', priority: 'High', message: `You have completed ${courseList}.${done.some((d) => d.certificateCode) ? ' Your certificate is ready.' : ''}`, actionUrl: '/student/certificates' }, { excludeSelf: (0, helpers_1.userId)(req) });
                if (sp.email) {
                    try {
                        const brand = await (0, outbound_1.brandForDepartment)(sp.departmentId ? Number(sp.departmentId) : null);
                        const certLines = done.filter((d) => d.certificateCode).map((d) => `<li>${(0, outbound_1.escapeHtml)(d.course)} — certificate <b>${(0, outbound_1.escapeHtml)(d.certificateCode)}</b></li>`).join('');
                        await (0, outbound_1.sendBrandEmail)(brand, sp.email, graduate ? `Congratulations on your graduation, ${sp.firstName}! 🎓` : `You have completed ${courseList}`, (0, outbound_1.brandEmailHtml)(brand, graduate ? `Congratulations, ${(0, outbound_1.escapeHtml)(sp.firstName)}!` : 'Course completed', `<p>${graduate ? 'We are proud to tell you that you have <b>graduated</b>.' : 'Well done — you have completed your course.'}</p>
               ${certLines ? `<ul>${certLines}</ul><p>You can view and print your certificate in your student portal.</p>` : ''}
               ${b.message ? `<p>${(0, outbound_1.escapeHtml)(String(b.message).slice(0, 1500))}</p>` : ''}<p>We wish you every success.</p>`));
                    }
                    catch (e) {
                        console.error('[school] email failed:', e.message);
                    }
                }
            }
            results.push({ studentId: sid, name: `${sp.firstName} ${sp.lastName}`, ok: true, graduated: graduate, courses: done, stillActive });
        }
        await (0, helpers_1.audit)(req, 'School', 'Graduate', 'Student', studentIds.join(','), `${(0, helpers_1.userName)(req)} graduated ${results.filter((r) => r.graduated).length} student(s) and completed ${results.reduce((t, r) => t + (r.courses?.length || 0), 0)} course enrolment(s)`, { studentIds, when, issue });
        (0, helpers_1.emitChange)(req, 'student', 'updated', { id: studentIds[0] });
        const g = results.filter((r) => r.graduated).length;
        return (0, recordRouter_1.ok)(res, { results }, g ? `${g} student${g === 1 ? '' : 's'} graduated` : 'Courses marked complete');
    }));
    r.post('/school/students/:id(\\d+)/reopen', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!canManageSchool(req))
            return (0, recordRouter_1.fail)(res, 403, 'Only school staff can do this');
        await helpers_1.db.query(`UPDATE student_profiles SET status = 'Active', "graduationDate" = NULL, "updatedAt" = NOW() WHERE id = :id`, { replacements: { id: Number(req.params.id) } });
        await (0, helpers_1.audit)(req, 'School', 'Update', 'Student', req.params.id, `${(0, helpers_1.userName)(req)} set student #${req.params.id} back to Active`);
        return (0, recordRouter_1.ok)(res, null, 'Student is active again');
    }));
    r.get('/school/certificate/:code', (0, recordRouter_1.wrap)(async (req, res) => {
        const c = (await q(`SELECT ce."certificateCode", ce."certificateName", ce."issuedDate", ce."verificationCode", ce.status::text AS status, c.title AS course, c.duration, c."departmentId",
              u."firstName", u."lastName", sp."userId", sp."studentNumber", c."instructorName"
       FROM certificates ce JOIN enrollments e ON e.id = ce."enrollmentId" JOIN courses c ON c.id = e."courseId"
       JOIN student_profiles sp ON sp.id = e."studentId" JOIN users u ON u.id = sp."userId"
       WHERE ce."certificateCode" = :code AND ce."deletedAt" IS NULL`, { code: req.params.code }))[0];
        if (!c)
            return (0, recordRouter_1.fail)(res, 404, 'Certificate not found');
        if (!canManageSchool(req) && Number(c.userId) !== (0, helpers_1.userId)(req))
            return (0, recordRouter_1.fail)(res, 403, 'You can only open your own certificate');
        const brand = await (0, outbound_1.brandForDepartment)(c.departmentId ? Number(c.departmentId) : null);
        return (0, recordRouter_1.ok)(res, { ...c, studentName: `${c.firstName} ${c.lastName}`, brand: { code: String(brand.code || '').toUpperCase(), name: brand.displayName, logoUrl: brand.logoUrl, color: brand.primaryColor, tagline: brand.tagline, address: brand.address, website: brand.website } });
    }));
    r.get('/school/my-certificates', (0, recordRouter_1.wrap)(async (req, res) => {
        const rows = await q(`SELECT ce."certificateCode", ce."certificateName", ce."issuedDate", c.title AS course FROM certificates ce JOIN enrollments e ON e.id = ce."enrollmentId"
       JOIN courses c ON c.id = e."courseId" JOIN student_profiles sp ON sp.id = e."studentId" WHERE sp."userId" = :u AND ce."deletedAt" IS NULL ORDER BY ce."issuedDate" DESC`, { u: (0, helpers_1.userId)(req) }).catch(() => []);
        return (0, recordRouter_1.ok)(res, rows);
    }));
    return r;
}
//# sourceMappingURL=school.js.map