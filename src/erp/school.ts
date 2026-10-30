import { Router, Request } from 'express';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { wrap, ok, fail } from './recordRouter';
import { audit, db, emitChange, isManagement, notifyUsers, roleOf, userId, userName } from './helpers';
import { brandEmailHtml, brandForDepartment, escapeHtml, sendBrandEmail } from './outbound';

/**
 * Kurios SAT and BeadMax schools: one overview of every student with their
 * courses and progress, and a single "Graduate" step that completes the
 * courses, issues certificates, marks the student Graduated and congratulates
 * them. Certificates can be printed or saved as PDF from MaxHub.
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;
const ACTIVE_ENR = ['Enrolled', 'InProgress', 'OnHold'];
const ACTIVE_SE = ['Active', 'Pending'];

function perms(req: Request): Set<string> { return new Set(((req as any).user?.permissions || []).map((p: string) => String(p).toLowerCase())); }
function canManageSchool(req: Request): boolean {
  if (isManagement(req) || ['hr', 'hod'].includes(roleOf(req))) return true;
  const p = perms(req);
  return ['stm.student.update.all', 'stm.student.update.own_department', 'lms.certificate.issue.all', 'lms.certificate.issue.own_department', 'lms.enrollment.create.all'].some((x) => p.has(x));
}

async function schoolDepts(school: string): Promise<number[]> {
  const { schoolDepartmentIds } = require('@utils/school');
  const ids = await schoolDepartmentIds(school);
  if (!ids?.length) return [0];
  const kids = await q(`SELECT id FROM departments WHERE "parentDepartmentId" IN (:ids) AND "deletedAt" IS NULL`, { ids });
  return [...new Set([...ids, ...kids.map((k) => Number(k.id))])];
}

/** Every course enrolment for the given students, from both enrolment tables. */
async function enrolmentsFor(studentIds: number[]) {
  if (!studentIds.length) return [] as any[];
  const a = await q(
    `SELECT 'E' AS src, e.id, e."studentId", e."courseId", c.title, c."courseCode", e.status::text AS status, COALESCE(e."progressPercentage", 0)::int AS progress,
            e."enrollmentDate" AS "startedAt", e."completionDate" AS "completedAt",
            (SELECT "certificateCode" FROM certificates ce WHERE ce."enrollmentId" = e.id AND ce."deletedAt" IS NULL AND COALESCE(ce.status::text, 'Issued') = 'Issued' LIMIT 1) AS "certificateCode"
     FROM enrollments e JOIN courses c ON c.id = e."courseId" WHERE e."studentId" IN (:ids) AND e."deletedAt" IS NULL`, { ids: studentIds },
  ).catch(() => [] as any[]);
  const b = await q(
    `SELECT 'S' AS src, se.id, se."studentId", se."courseId", c.title, c."courseCode", se.status::text AS status, COALESCE(se."progressPercentage", 0)::int AS progress,
            se."enrolledAt" AS "startedAt", se."completedAt", CASE WHEN se."isCertificateIssued" THEN 'issued' END AS "certificateCode"
     FROM student_enrollments se JOIN courses c ON c.id = se."courseId" WHERE se."studentId" IN (:ids)`, { ids: studentIds },
  ).catch(() => [] as any[]);
  // The same course can sit in both tables; prefer the staff-side record.
  const seen = new Set(a.map((r) => `${r.studentId}:${r.courseId}`));
  return [...a, ...b.filter((r) => !seen.has(`${r.studentId}:${r.courseId}`))].map((r) => ({ ...r, id: Number(r.id), studentId: Number(r.studentId), courseId: Number(r.courseId) }));
}

async function lessonProgress(studentIds: number[]) {
  if (!studentIds.length) return new Map<string, number>();
  const rows = await q(
    `SELECT p."studentId", p."courseId", COUNT(*) FILTER (WHERE p."completedAt" IS NOT NULL)::int done,
            (SELECT COUNT(*)::int FROM erp_lessons l WHERE l."courseId" = p."courseId" AND l.status = 'Published') total
     FROM erp_lesson_progress p WHERE p."studentId" IN (:ids) GROUP BY p."studentId", p."courseId"`, { ids: studentIds },
  ).catch(() => [] as any[]);
  return new Map(rows.map((r) => [`${r.studentId}:${r.courseId}`, r.total ? Math.round((r.done / r.total) * 100) : 0]));
}

const isActive = (e: any) => (e.src === 'E' ? ACTIVE_ENR : ACTIVE_SE).includes(e.status);
const isDone = (e: any) => e.status === 'Completed';

export function schoolRouter(): Router {
  const r = Router();

  r.get('/school/students', wrap(async (req, res) => {
    if (!canManageSchool(req)) return fail(res, 403, 'Only school staff can see students');
    const school = String(req.query.school || 'KS').toUpperCase() === 'BM' ? 'BM' : 'KS';
    const depts = await schoolDepts(school);
    const rows = await q(
      `SELECT sp.id, sp."studentNumber", sp.status::text AS status, sp."departmentId", sp."enrollmentDate", sp."graduationDate", sp."expectedGraduationDate", sp."createdAt",
              sp."guardianName", sp."guardianPhone", sp."guardianEmail", sp."companyId", u.id AS "userId", u."firstName", u."lastName", u.email, u.phone, d.name AS "departmentName"
       FROM student_profiles sp JOIN users u ON u.id = sp."userId" LEFT JOIN departments d ON d.id = sp."departmentId"
       WHERE sp."departmentId" IN (:depts) OR sp.id IN (
         SELECT e."studentId" FROM enrollments e JOIN courses c ON c.id = e."courseId" WHERE c."departmentId" IN (:depts) AND e."deletedAt" IS NULL
         UNION SELECT se."studentId" FROM student_enrollments se JOIN courses c ON c.id = se."courseId" WHERE c."departmentId" IN (:depts))
       ORDER BY u."firstName", u."lastName"`, { depts },
    );
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
    const counts = { all: out.length, Active: 0, Graduated: 0, Suspended: 0, Withdrawn: 0, Inactive: 0, ready: out.filter((s) => s.readyToGraduate).length } as Record<string, number>;
    out.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return ok(res, { school, students: out, counts });
  }));

  r.get('/school/courses', wrap(async (req, res) => {
    if (!canManageSchool(req)) return fail(res, 403, 'Only school staff can see this');
    const school = String(req.query.school || 'KS').toUpperCase() === 'BM' ? 'BM' : 'KS';
    const depts = await schoolDepts(school);
    const courses = await q(
      `SELECT c.id, c."courseCode", c.title, c.description, c.status::text AS status, c."instructorName", c.duration, c.fee, c."startDate", c."endDate", c."certificateRequired", d.name AS "departmentName"
       FROM courses c LEFT JOIN departments d ON d.id = c."departmentId" WHERE c."deletedAt" IS NULL AND c."departmentId" IN (:depts) ORDER BY c."startDate" DESC NULLS LAST, c.title`, { depts },
    );
    const ids = courses.map((c) => Number(c.id));
    const stats = ids.length ? await q(
      `SELECT "courseId", COUNT(*)::int total, COUNT(*) FILTER (WHERE status IN ('Completed'))::int completed, COUNT(*) FILTER (WHERE status IN ('Enrolled','InProgress','OnHold','Active','Pending'))::int active,
              AVG(progress)::int avg
       FROM (SELECT "courseId", status::text status, COALESCE("progressPercentage",0) progress FROM enrollments WHERE "courseId" IN (:ids) AND "deletedAt" IS NULL AND "studentId" IS NOT NULL
             UNION ALL SELECT "courseId", status::text, COALESCE("progressPercentage",0) FROM student_enrollments WHERE "courseId" IN (:ids)) x GROUP BY "courseId"`, { ids },
    ) : [];
    const lessons = ids.length ? await q(`SELECT "courseId", COUNT(*) FILTER (WHERE status = 'Published')::int pub, COUNT(*)::int total FROM erp_lessons WHERE "courseId" IN (:ids) GROUP BY "courseId"`, { ids }).catch(() => [] as any[]) : [];
    const certs = ids.length ? await q(`SELECT e."courseId", COUNT(*)::int n FROM certificates ce JOIN enrollments e ON e.id = ce."enrollmentId" WHERE e."courseId" IN (:ids) AND ce."deletedAt" IS NULL GROUP BY e."courseId"`, { ids }).catch(() => [] as any[]) : [];
    const sm = new Map(stats.map((s) => [Number(s.courseId), s]));
    const lm = new Map(lessons.map((s) => [Number(s.courseId), s]));
    const cm = new Map(certs.map((s) => [Number(s.courseId), Number(s.n)]));
    return ok(res, courses.map((c) => ({
      ...c, id: Number(c.id), fee: c.fee != null ? Number(c.fee) : null,
      students: Number(sm.get(Number(c.id))?.total || 0), active: Number(sm.get(Number(c.id))?.active || 0), completed: Number(sm.get(Number(c.id))?.completed || 0),
      avgProgress: sm.get(Number(c.id))?.avg ?? 0, lessons: Number(lm.get(Number(c.id))?.pub || 0), draftLessons: Number(lm.get(Number(c.id))?.total || 0) - Number(lm.get(Number(c.id))?.pub || 0),
      certificates: cm.get(Number(c.id)) || 0,
    })));
  }));

  /** One step: complete courses, issue certificates, mark Graduated, congratulate. */
  r.post('/school/graduate', wrap(async (req, res) => {
    if (!canManageSchool(req)) return fail(res, 403, 'Only school staff can graduate students');
    const b = req.body || {};
    const studentIds: number[] = [...new Set((Array.isArray(b.studentIds) ? b.studentIds : []).map(Number).filter(Boolean))] as number[];
    if (!studentIds.length) return fail(res, 400, 'Choose at least one student');
    const onlyCourses: number[] | null = Array.isArray(b.courseIds) && b.courseIds.length ? b.courseIds.map(Number) : null;
    const when = /^\d{4}-\d{2}-\d{2}$/.test(String(b.graduationDate || '')) ? String(b.graduationDate) : new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    const issue = b.issueCertificates !== false;
    const notify = b.notify !== false;
    const enr = await enrolmentsFor(studentIds);
    const results: any[] = [];
    for (const sid of studentIds) {
      const sp = (await q(`SELECT sp.*, u."firstName", u."lastName", u.email FROM student_profiles sp JOIN users u ON u.id = sp."userId" WHERE sp.id = :id`, { id: sid }))[0];
      if (!sp) { results.push({ studentId: sid, ok: false, error: 'Student not found' }); continue; }
      const mine = enr.filter((e) => e.studentId === sid && (onlyCourses ? onlyCourses.includes(e.courseId) : isActive(e) || isDone(e)));
      const done: any[] = [];
      for (const e of mine) {
        if (e.src === 'E') {
          if (!isDone(e)) await db.query(`UPDATE enrollments SET status = 'Completed', "completionDate" = :d, "progressPercentage" = 100, "updatedAt" = NOW() WHERE id = :id`, { replacements: { d: when, id: e.id } });
          let code = e.certificateCode;
          if (issue && !code) {
            code = `CERT-${e.courseCode || 'C'}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
            await db.query(
              `INSERT INTO certificates (uuid, "enrollmentId", "certificateCode", "certificateName", "issuedDate", "verificationCode", status, "createdAt", "updatedAt")
               VALUES (:u, :e, :c, :n, :d, :v, 'Issued', NOW(), NOW())`,
              { replacements: { u: uuidv4(), e: e.id, c: code, n: `Certificate of Completion — ${e.title}`, d: when, v: uuidv4().slice(0, 8).toUpperCase() } },
            );
          }
          // Keep the student-portal record in step.
          await db.query(`UPDATE student_enrollments SET status = 'Completed', "completedAt" = COALESCE("completedAt", :d), "progressPercentage" = 100,
            "isCertificateIssued" = "isCertificateIssued" OR :ci, "certificateIssuedAt" = CASE WHEN :ci THEN COALESCE("certificateIssuedAt", NOW()) ELSE "certificateIssuedAt" END, "updatedAt" = NOW()
            WHERE "studentId" = :s AND "courseId" = :c`, { replacements: { d: when, ci: issue, s: sid, c: e.courseId } }).catch(() => null);
          done.push({ course: e.title, certificateCode: code || null });
        } else {
          await db.query(`UPDATE student_enrollments SET status = 'Completed', "completedAt" = COALESCE("completedAt", :d), "progressPercentage" = 100,
            "isCertificateIssued" = "isCertificateIssued" OR :ci, "certificateIssuedAt" = CASE WHEN :ci THEN COALESCE("certificateIssuedAt", NOW()) ELSE "certificateIssuedAt" END, "updatedAt" = NOW() WHERE id = :id`,
          { replacements: { d: when, ci: issue, id: e.id } });
          // Make sure there is a staff-side enrolment so a certificate exists in MaxHub.
          let certCode: string | null = null;
          if (issue) {
            const rows = await q(`SELECT id FROM enrollments WHERE "studentId" = :s AND "courseId" = :c AND "deletedAt" IS NULL LIMIT 1`, { s: sid, c: e.courseId });
            let enrId = rows[0]?.id;
            if (!enrId) {
              enrId = (await q(`INSERT INTO enrollments (uuid, "courseId", "studentId", "enrollmentDate", "completionDate", status, "progressPercentage", "createdAt", "updatedAt")
                VALUES (:u, :c, :s, COALESCE(:st, NOW()), :d, 'Completed', 100, NOW(), NOW()) RETURNING id`, { u: uuidv4(), c: e.courseId, s: sid, st: e.startedAt || null, d: when }))[0].id;
            }
            const has = (await q(`SELECT "certificateCode" FROM certificates WHERE "enrollmentId" = :e AND "deletedAt" IS NULL LIMIT 1`, { e: enrId }))[0];
            certCode = has?.certificateCode || `CERT-${e.courseCode || 'C'}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
            if (!has) await db.query(`INSERT INTO certificates (uuid, "enrollmentId", "certificateCode", "certificateName", "issuedDate", "verificationCode", status, "createdAt", "updatedAt")
              VALUES (:u, :e, :c, :n, :d, :v, 'Issued', NOW(), NOW())`, { replacements: { u: uuidv4(), e: enrId, c: certCode, n: `Certificate of Completion — ${e.title}`, d: when, v: uuidv4().slice(0, 8).toUpperCase() } });
          }
          done.push({ course: e.title, certificateCode: certCode });
        }
      }
      // Graduated once nothing is still in progress (or when asked to graduate the whole programme).
      const after = await enrolmentsFor([sid]);
      const stillActive = after.filter(isActive).length;
      const graduate = b.graduateProgramme === true || stillActive === 0;
      if (graduate) {
        await db.query(`UPDATE student_profiles SET status = 'Graduated', "graduationDate" = :d, "updatedAt" = NOW() WHERE id = :id`, { replacements: { d: when, id: sid } });
      }
      if (notify) {
        const courseList = done.map((d) => d.course).join(', ') || 'your course';
        await notifyUsers(req, [Number(sp.userId)], { title: graduate ? '🎓 Congratulations, graduate!' : 'Course completed 🎉', type: 'Other', priority: 'High', message: `You have completed ${courseList}.${done.some((d) => d.certificateCode) ? ' Your certificate is ready.' : ''}`, actionUrl: '/student/certificates' }, { excludeSelf: userId(req) });
        if (sp.email) {
          try {
            const brand = await brandForDepartment(sp.departmentId ? Number(sp.departmentId) : null);
            const certLines = done.filter((d) => d.certificateCode).map((d) => `<li>${escapeHtml(d.course)} — certificate <b>${escapeHtml(d.certificateCode)}</b></li>`).join('');
            await sendBrandEmail(brand, sp.email, graduate ? `Congratulations on your graduation, ${sp.firstName}! 🎓` : `You have completed ${courseList}`, brandEmailHtml(brand,
              graduate ? `Congratulations, ${escapeHtml(sp.firstName)}!` : 'Course completed',
              `<p>${graduate ? 'We are proud to tell you that you have <b>graduated</b>.' : 'Well done — you have completed your course.'}</p>
               ${certLines ? `<ul>${certLines}</ul><p>You can view and print your certificate in your student portal.</p>` : ''}
               ${b.message ? `<p>${escapeHtml(String(b.message).slice(0, 1500))}</p>` : ''}<p>We wish you every success.</p>`));
          } catch (e: any) { console.error('[school] email failed:', e.message); }
        }
      }
      results.push({ studentId: sid, name: `${sp.firstName} ${sp.lastName}`, ok: true, graduated: graduate, courses: done, stillActive });
    }
    await audit(req, 'School', 'Graduate', 'Student', studentIds.join(','), `${userName(req)} graduated ${results.filter((r) => r.graduated).length} student(s) and completed ${results.reduce((t, r) => t + (r.courses?.length || 0), 0)} course enrolment(s)`, { studentIds, when, issue });
    emitChange(req, 'student', 'updated', { id: studentIds[0] });
    const g = results.filter((r) => r.graduated).length;
    return ok(res, { results }, g ? `${g} student${g === 1 ? '' : 's'} graduated` : 'Courses marked complete');
  }));

  r.post('/school/students/:id(\\d+)/reopen', wrap(async (req, res) => {
    if (!canManageSchool(req)) return fail(res, 403, 'Only school staff can do this');
    await db.query(`UPDATE student_profiles SET status = 'Active', "graduationDate" = NULL, "updatedAt" = NOW() WHERE id = :id`, { replacements: { id: Number(req.params.id) } });
    await audit(req, 'School', 'Update', 'Student', req.params.id, `${userName(req)} set student #${req.params.id} back to Active`);
    return ok(res, null, 'Student is active again');
  }));

  /** Printable certificate (staff, or the student it belongs to). */
  r.get('/school/certificate/:code', wrap(async (req, res) => {
    const c = (await q(
      `SELECT ce."certificateCode", ce."certificateName", ce."issuedDate", ce."verificationCode", ce.status::text AS status, c.title AS course, c.duration, c."departmentId",
              u."firstName", u."lastName", sp."userId", sp."studentNumber", c."instructorName"
       FROM certificates ce JOIN enrollments e ON e.id = ce."enrollmentId" JOIN courses c ON c.id = e."courseId"
       JOIN student_profiles sp ON sp.id = e."studentId" JOIN users u ON u.id = sp."userId"
       WHERE ce."certificateCode" = :code AND ce."deletedAt" IS NULL`, { code: req.params.code },
    ))[0];
    if (!c) return fail(res, 404, 'Certificate not found');
    if (!canManageSchool(req) && Number(c.userId) !== userId(req)) return fail(res, 403, 'You can only open your own certificate');
    const brand: any = await brandForDepartment(c.departmentId ? Number(c.departmentId) : null);
    return ok(res, { ...c, studentName: `${c.firstName} ${c.lastName}`, brand: { name: brand.displayName, logoUrl: brand.logoUrl, color: brand.primaryColor, tagline: brand.tagline, address: brand.address, website: brand.website } });
  }));

  /** The student's own certificates (for the student portal). */
  r.get('/school/my-certificates', wrap(async (req, res) => {
    const rows = await q(
      `SELECT ce."certificateCode", ce."certificateName", ce."issuedDate", c.title AS course FROM certificates ce JOIN enrollments e ON e.id = ce."enrollmentId"
       JOIN courses c ON c.id = e."courseId" JOIN student_profiles sp ON sp.id = e."studentId" WHERE sp."userId" = :u AND ce."deletedAt" IS NULL ORDER BY ce."issuedDate" DESC`, { u: userId(req) },
    ).catch(() => [] as any[]);
    return ok(res, rows);
  }));

  return r;
}
