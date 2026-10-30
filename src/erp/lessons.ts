import { Router, Request } from 'express';
import { QueryTypes } from 'sequelize';
import { ErpModels } from './models';
import { wrap, ok, fail } from './recordRouter';
import { audit, db, emitChange, isManagement, notifyUsers, roleOf, toNum, userId, userName } from './helpers';

/**
 * Online lessons for Kurios SAT and BeadMax courses: video, notes, files and a
 * short quiz per lesson. Students work through them in the student portal;
 * teachers build them on the course page and see each student's progress.
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;

function canTeach(req: Request): boolean {
  if (isManagement(req) || ['hr', 'hod'].includes(roleOf(req))) return true;
  const perms = new Set(((req as any).user?.permissions || []).map((p: string) => String(p).toLowerCase()));
  return ['lms.course.update.all', 'lms.course.update.own_department', 'lms.course.create.all'].some((p) => perms.has(p));
}

async function studentOf(uid: number): Promise<any | null> {
  return (await q(`SELECT id, "userId", "departmentId" FROM student_profiles WHERE "userId" = :u LIMIT 1`, { u: uid }).catch(() => [] as any[]))[0] || null;
}

/** Courses a student is enrolled in (either enrolment table), not dropped. */
async function enrolledCourseIds(studentId: number): Promise<number[]> {
  const rows = await q(
    `SELECT "courseId" FROM enrollments WHERE "studentId" = :s AND "deletedAt" IS NULL AND COALESCE(status::text, '') NOT IN ('Dropped','Cancelled')
     UNION SELECT "courseId" FROM student_enrollments WHERE "studentId" = :s AND COALESCE(status::text, '') NOT IN ('Dropped','Withdrawn','Cancelled')`, { s: studentId },
  ).catch(() => [] as any[]);
  return [...new Set(rows.map((r) => Number(r.courseId)))];
}

const cleanQuiz = (v: any) => (Array.isArray(v) ? v : []).map((x: any) => ({
  q: String(x?.q || '').trim().slice(0, 1000),
  options: (Array.isArray(x?.options) ? x.options : []).map((o: any) => String(o || '').trim().slice(0, 300)).filter(Boolean).slice(0, 6),
  answer: Math.max(0, toNum(x?.answer)),
  explain: x?.explain ? String(x.explain).slice(0, 1000) : null,
})).filter((x: any) => x.q && x.options.length >= 2).map((x: any) => ({ ...x, answer: Math.min(x.answer, x.options.length - 1) })).slice(0, 30);

const cleanFiles = (v: any) => (Array.isArray(v) ? v : []).map((f: any) => ({ name: String(f?.name || 'File').slice(0, 200), url: String(f?.url || '') }))
  .filter((f: any) => /^https?:\/\//.test(f.url)).slice(0, 20);

/** Keep the course progress % on the enrolment in step with lessons completed. */
async function syncProgress(courseId: number, studentId: number) {
  const total = Number((await q(`SELECT COUNT(*)::int n FROM erp_lessons WHERE "courseId" = :c AND status = 'Published'`, { c: courseId }))[0]?.n || 0);
  if (!total) return 0;
  const done = Number((await q(
    `SELECT COUNT(*)::int n FROM erp_lesson_progress p JOIN erp_lessons l ON l.id = p."lessonId" AND l.status = 'Published'
     WHERE p."courseId" = :c AND p."studentId" = :s AND p."completedAt" IS NOT NULL`, { c: courseId, s: studentId }))[0]?.n || 0);
  const pct = Math.round((done / total) * 100);
  await db.query(`UPDATE enrollments SET "progressPercentage" = GREATEST(COALESCE("progressPercentage", 0), :p), "updatedAt" = NOW() WHERE "courseId" = :c AND "studentId" = :s`, { replacements: { p: pct, c: courseId, s: studentId } }).catch(() => null);
  await db.query(`UPDATE student_enrollments SET "progressPercentage" = GREATEST(COALESCE("progressPercentage", 0), :p), "updatedAt" = NOW() WHERE "courseId" = :c AND "studentId" = :s`, { replacements: { p: pct, c: courseId, s: studentId } }).catch(() => null);
  return pct;
}

async function courseTeachers(courseId: number): Promise<number[]> {
  const c = (await q(`SELECT * FROM courses WHERE id = :c`, { c: courseId }))[0];
  if (!c) return [];
  const ids = [c.instructorId, c.instructorUserId, c.createdById].filter(Boolean).map(Number);
  const heads = await q(`SELECT "headUserId" FROM departments WHERE id = :d AND "headUserId" IS NOT NULL`, { d: c.departmentId || 0 }).catch(() => [] as any[]);
  return [...new Set([...ids, ...heads.map((h) => Number(h.headUserId))])];
}

export function lessonsRouter(): Router {
  const r = Router();

  // ── Teacher side ────────────────────────────────────────────────────────
  r.get('/courses/:courseId(\\d+)/lessons', wrap(async (req, res) => {
    const courseId = Number(req.params.courseId);
    if (canTeach(req)) {
      const rows: any[] = await (ErpModels.Lesson as any).findAll({ where: { courseId }, order: [['sortOrder', 'ASC'], ['id', 'ASC']], raw: true });
      const stats = await q(
        `SELECT "lessonId", COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL)::int done, AVG("bestScore")::int avg FROM erp_lesson_progress WHERE "courseId" = :c GROUP BY "lessonId"`, { c: courseId },
      );
      const st = new Map(stats.map((s) => [Number(s.lessonId), s]));
      const students = Number((await q(
        `SELECT COUNT(DISTINCT s)::int n FROM (SELECT "studentId" s FROM enrollments WHERE "courseId" = :c AND "studentId" IS NOT NULL AND "deletedAt" IS NULL UNION SELECT "studentId" FROM student_enrollments WHERE "courseId" = :c) x`, { c: courseId },
      ).catch(() => [{ n: 0 }]))[0]?.n || 0);
      return ok(res, { lessons: rows.map((l) => ({ ...l, id: Number(l.id), completed: Number(st.get(Number(l.id))?.done || 0), avgScore: st.get(Number(l.id))?.avg ?? null })), students, canTeach: true });
    }
    const me = await studentOf(userId(req));
    if (!me || !(await enrolledCourseIds(Number(me.id))).includes(courseId)) return fail(res, 403, 'You are not enrolled in this course');
    return fail(res, 400, 'Use the student lessons page');
  }));

  r.get('/courses/:courseId(\\d+)/lessons/progress', wrap(async (req, res) => {
    if (!canTeach(req)) return fail(res, 403, 'Only teachers can see class progress');
    const courseId = Number(req.params.courseId);
    const lessons = await q(`SELECT id, title FROM erp_lessons WHERE "courseId" = :c AND status = 'Published' ORDER BY "sortOrder", id`, { c: courseId });
    const students = await q(
      `SELECT DISTINCT sp.id, TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS name, u.email
       FROM student_profiles sp JOIN users u ON u.id = sp."userId"
       WHERE sp.id IN (SELECT "studentId" FROM enrollments WHERE "courseId" = :c AND "deletedAt" IS NULL UNION SELECT "studentId" FROM student_enrollments WHERE "courseId" = :c)
       ORDER BY name`, { c: courseId },
    ).catch(() => [] as any[]);
    const prog = await q(`SELECT "lessonId", "studentId", "completedAt", "bestScore", "lastOpenedAt" FROM erp_lesson_progress WHERE "courseId" = :c`, { c: courseId });
    const by = new Map(prog.map((p) => [`${p.studentId}:${p.lessonId}`, p]));
    return ok(res, {
      lessons: lessons.map((l) => ({ id: Number(l.id), title: l.title })),
      students: students.map((s) => {
        const cells = lessons.map((l) => { const p = by.get(`${s.id}:${l.id}`); return p ? { done: !!p.completedAt, score: p.bestScore, opened: !!p.lastOpenedAt } : null; });
        const done = cells.filter((c) => c?.done).length;
        const lastSeen = prog.filter((p) => Number(p.studentId) === Number(s.id)).map((p) => p.lastOpenedAt).filter(Boolean).sort().pop() || null;
        return { id: Number(s.id), name: s.name || s.email, cells, done, percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0, lastSeen };
      }),
    });
  }));

  r.post('/courses/:courseId(\\d+)/lessons', wrap(async (req, res) => {
    if (!canTeach(req)) return fail(res, 403, 'Only teachers can add lessons');
    const courseId = Number(req.params.courseId);
    const course = (await q(`SELECT id, title FROM courses WHERE id = :c`, { c: courseId }))[0];
    if (!course) return fail(res, 404, 'Course not found');
    const b = req.body || {};
    if (!String(b.title || '').trim()) return fail(res, 400, 'Give the lesson a title');
    const max = Number((await q(`SELECT COALESCE(MAX("sortOrder"), 0)::int m FROM erp_lessons WHERE "courseId" = :c`, { c: courseId }))[0]?.m || 0);
    const row: any = await (ErpModels.Lesson as any).create({
      courseId, section: b.section ? String(b.section).slice(0, 160) : null, title: String(b.title).trim().slice(0, 200), summary: b.summary || null,
      videoUrl: b.videoUrl || null, body: b.body || null, files: cleanFiles(b.files), quiz: cleanQuiz(b.quiz), passMark: Math.min(100, Math.max(0, toNum(b.passMark, 60))),
      minutes: b.minutes ? toNum(b.minutes) : null, sortOrder: max + 1, status: b.status === 'Published' ? 'Published' : 'Draft', createdById: userId(req),
    });
    await audit(req, 'Lessons', 'Create', 'Lesson', row.id, `${userName(req)} added lesson “${row.title}” to ${course.title}`);
    if (row.status === 'Published') await announceLesson(req, row, course.title);
    emitChange(req, 'lesson', 'created', row);
    return ok(res, row, 'Lesson saved', 201);
  }));

  async function announceLesson(req: Request, lesson: any, courseTitle: string) {
    const users = await q(
      `SELECT DISTINCT sp."userId" FROM student_profiles sp WHERE sp.id IN (SELECT "studentId" FROM enrollments WHERE "courseId" = :c AND "deletedAt" IS NULL UNION SELECT "studentId" FROM student_enrollments WHERE "courseId" = :c)`,
      { c: lesson.courseId },
    ).catch(() => [] as any[]);
    await notifyUsers(req, users.map((u) => Number(u.userId)), { title: 'New lesson available', message: `“${lesson.title}” has been added to ${courseTitle}.`, type: 'Other', actionUrl: `/student/lessons/${lesson.courseId}?lesson=${lesson.id}` });
  }

  r.put('/lessons/:id(\\d+)', wrap(async (req, res) => {
    if (!canTeach(req)) return fail(res, 403, 'Only teachers can change lessons');
    const row: any = await (ErpModels.Lesson as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Lesson not found');
    const b = req.body || {};
    const wasDraft = row.status !== 'Published';
    const data: any = {};
    for (const k of ['section', 'title', 'summary', 'videoUrl', 'body']) if (b[k] !== undefined) data[k] = b[k] === '' ? null : String(b[k]);
    if (b.files !== undefined) data.files = cleanFiles(b.files);
    if (b.quiz !== undefined) data.quiz = cleanQuiz(b.quiz);
    if (b.passMark !== undefined) data.passMark = Math.min(100, Math.max(0, toNum(b.passMark, 60)));
    if (b.minutes !== undefined) data.minutes = b.minutes ? toNum(b.minutes) : null;
    if (b.status) data.status = b.status === 'Published' ? 'Published' : 'Draft';
    if (data.title === null) delete data.title;
    await row.update(data);
    if (wasDraft && row.status === 'Published') {
      const c = (await q(`SELECT title FROM courses WHERE id = :c`, { c: row.courseId }))[0];
      await announceLesson(req, row, c?.title || 'your course');
    }
    await audit(req, 'Lessons', 'Update', 'Lesson', row.id, `${userName(req)} updated lesson “${row.title}”`);
    emitChange(req, 'lesson', 'updated', row);
    return ok(res, row, 'Lesson saved');
  }));

  r.post('/courses/:courseId(\\d+)/lessons/order', wrap(async (req, res) => {
    if (!canTeach(req)) return fail(res, 403, 'Only teachers can reorder lessons');
    const ids: number[] = (Array.isArray(req.body?.ids) ? req.body.ids : []).map(Number);
    for (let i = 0; i < ids.length; i++) await db.query(`UPDATE erp_lessons SET "sortOrder" = :o WHERE id = :id AND "courseId" = :c`, { replacements: { o: i + 1, id: ids[i], c: Number(req.params.courseId) } });
    return ok(res, { ids }, 'Order saved');
  }));

  r.delete('/lessons/:id(\\d+)', wrap(async (req, res) => {
    if (!canTeach(req)) return fail(res, 403, 'Only teachers can delete lessons');
    const row: any = await (ErpModels.Lesson as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Lesson not found');
    await db.query(`DELETE FROM erp_lesson_progress WHERE "lessonId" = :id`, { replacements: { id: row.id } });
    await row.destroy();
    await audit(req, 'Lessons', 'Delete', 'Lesson', row.id, `${userName(req)} deleted lesson “${row.title}”`);
    emitChange(req, 'lesson', 'deleted', { id: row.id });
    return ok(res, { id: row.id }, 'Lesson deleted');
  }));

  // ── Student side ────────────────────────────────────────────────────────
  r.get('/my-lessons', wrap(async (req, res) => {
    const me = await studentOf(userId(req));
    if (!me) return ok(res, { courses: [], student: false });
    const ids = await enrolledCourseIds(Number(me.id));
    if (!ids.length) return ok(res, { courses: [], student: true });
    const courses = await q(`SELECT id, title, description, thumbnail FROM courses WHERE id IN (:ids)`, { ids }).catch(() => q(`SELECT id, title FROM courses WHERE id IN (:ids)`, { ids }));
    const counts = await q(`SELECT "courseId", COUNT(*)::int n, COALESCE(SUM(minutes), 0)::int mins FROM erp_lessons WHERE status = 'Published' AND "courseId" IN (:ids) GROUP BY "courseId"`, { ids });
    const done = await q(
      `SELECT p."courseId", COUNT(*)::int n, MAX(p."lastOpenedAt") last FROM erp_lesson_progress p JOIN erp_lessons l ON l.id = p."lessonId" AND l.status = 'Published'
       WHERE p."studentId" = :s AND p."completedAt" IS NOT NULL GROUP BY p."courseId"`, { s: me.id },
    );
    const cm = new Map(counts.map((c) => [Number(c.courseId), c]));
    const dm = new Map(done.map((d) => [Number(d.courseId), d]));
    return ok(res, {
      student: true,
      courses: courses.map((c) => {
        const total = Number(cm.get(Number(c.id))?.n || 0); const d = Number(dm.get(Number(c.id))?.n || 0);
        return { id: Number(c.id), title: c.title, description: c.description || null, thumbnail: c.thumbnail || null, lessons: total, minutes: Number(cm.get(Number(c.id))?.mins || 0), completed: d, percent: total ? Math.round((d / total) * 100) : 0 };
      }),
    });
  }));

  r.get('/my-lessons/:courseId(\\d+)', wrap(async (req, res) => {
    const me = await studentOf(userId(req));
    const courseId = Number(req.params.courseId);
    const preview = canTeach(req) && !me;
    if (!preview && (!me || !(await enrolledCourseIds(Number(me.id))).includes(courseId))) return fail(res, 403, 'You are not enrolled in this course');
    const course = (await q(`SELECT id, title FROM courses WHERE id = :c`, { c: courseId }))[0];
    const lessons = await q(`SELECT id, section, title, summary, minutes, quiz, "sortOrder" FROM erp_lessons WHERE "courseId" = :c AND status = 'Published' ORDER BY "sortOrder", id`, { c: courseId });
    const prog = me ? await q(`SELECT "lessonId", "completedAt", "bestScore", attempts FROM erp_lesson_progress WHERE "courseId" = :c AND "studentId" = :s`, { c: courseId, s: me.id }) : [];
    const pm = new Map(prog.map((p) => [Number(p.lessonId), p]));
    const list = lessons.map((l) => {
      const p = pm.get(Number(l.id));
      return { id: Number(l.id), section: l.section, title: l.title, summary: l.summary, minutes: l.minutes, questions: Array.isArray(l.quiz) ? l.quiz.length : 0, done: !!p?.completedAt, bestScore: p?.bestScore ?? null, attempts: p?.attempts || 0 };
    });
    const done = list.filter((l) => l.done).length;
    return ok(res, { course: { id: courseId, title: course?.title || 'Course' }, lessons: list, completed: done, percent: list.length ? Math.round((done / list.length) * 100) : 0, preview });
  }));

  r.get('/my-lessons/lesson/:id(\\d+)', wrap(async (req, res) => {
    const l: any = await (ErpModels.Lesson as any).findByPk(req.params.id, { raw: true });
    if (!l || (l.status !== 'Published' && !canTeach(req))) return fail(res, 404, 'Lesson not found');
    const me = await studentOf(userId(req));
    if (!canTeach(req) && (!me || !(await enrolledCourseIds(Number(me.id))).includes(Number(l.courseId)))) return fail(res, 403, 'You are not enrolled in this course');
    let progress: any = null;
    if (me) {
      await db.query(
        `INSERT INTO erp_lesson_progress ("lessonId", "courseId", "studentId", attempts, "lastOpenedAt", "createdAt", "updatedAt") VALUES (:l, :c, :s, 0, NOW(), NOW(), NOW())
         ON CONFLICT ("lessonId", "studentId") DO UPDATE SET "lastOpenedAt" = NOW()`, { replacements: { l: l.id, c: l.courseId, s: me.id } },
      );
      progress = (await q(`SELECT "completedAt", "bestScore", attempts FROM erp_lesson_progress WHERE "lessonId" = :l AND "studentId" = :s`, { l: l.id, s: me.id }))[0];
    }
    const quiz = (Array.isArray(l.quiz) ? l.quiz : []).map((x: any) => ({ q: x.q, options: x.options })); // answers stay on the server
    return ok(res, { id: Number(l.id), courseId: Number(l.courseId), section: l.section, title: l.title, summary: l.summary, videoUrl: l.videoUrl, body: l.body, files: l.files || [], quiz, passMark: l.passMark, minutes: l.minutes, progress });
  }));

  r.post('/my-lessons/lesson/:id(\\d+)/complete', wrap(async (req, res) => {
    const l: any = await (ErpModels.Lesson as any).findByPk(req.params.id, { raw: true });
    const me = await studentOf(userId(req));
    if (!l || !me) return fail(res, 404, 'Lesson not found');
    if (!(await enrolledCourseIds(Number(me.id))).includes(Number(l.courseId))) return fail(res, 403, 'You are not enrolled in this course');
    if (Array.isArray(l.quiz) && l.quiz.length) return fail(res, 400, 'Pass the quiz to complete this lesson');
    await db.query(
      `INSERT INTO erp_lesson_progress ("lessonId", "courseId", "studentId", attempts, "completedAt", "lastOpenedAt", "createdAt", "updatedAt") VALUES (:l, :c, :s, 0, NOW(), NOW(), NOW(), NOW())
       ON CONFLICT ("lessonId", "studentId") DO UPDATE SET "completedAt" = COALESCE(erp_lesson_progress."completedAt", NOW())`, { replacements: { l: l.id, c: l.courseId, s: me.id } },
    );
    const pct = await syncProgress(Number(l.courseId), Number(me.id));
    if (pct === 100) await finishedCourse(req, Number(l.courseId));
    return ok(res, { completed: true, coursePercent: pct }, 'Lesson completed');
  }));

  r.post('/my-lessons/lesson/:id(\\d+)/quiz', wrap(async (req, res) => {
    const l: any = await (ErpModels.Lesson as any).findByPk(req.params.id, { raw: true });
    const me = await studentOf(userId(req));
    if (!l || !me) return fail(res, 404, 'Lesson not found');
    if (!(await enrolledCourseIds(Number(me.id))).includes(Number(l.courseId))) return fail(res, 403, 'You are not enrolled in this course');
    const quiz: any[] = Array.isArray(l.quiz) ? l.quiz : [];
    if (!quiz.length) return fail(res, 400, 'This lesson has no quiz');
    const answers: number[] = (Array.isArray(req.body?.answers) ? req.body.answers : []).map((a: any) => (a === null || a === undefined ? -1 : Number(a)));
    const right = quiz.filter((x, i) => answers[i] === Number(x.answer)).length;
    const score = Math.round((right / quiz.length) * 100);
    const passed = score >= Number(l.passMark || 0);
    await db.query(
      `INSERT INTO erp_lesson_progress ("lessonId", "courseId", "studentId", attempts, "bestScore", "lastAnswers", "completedAt", "lastOpenedAt", "createdAt", "updatedAt")
       VALUES (:l, :c, :s, 1, :sc, CAST(:ans AS jsonb), CASE WHEN :p THEN NOW() ELSE NULL END, NOW(), NOW(), NOW())
       ON CONFLICT ("lessonId", "studentId") DO UPDATE SET attempts = erp_lesson_progress.attempts + 1, "bestScore" = GREATEST(COALESCE(erp_lesson_progress."bestScore", 0), :sc),
         "lastAnswers" = CAST(:ans AS jsonb), "completedAt" = COALESCE(erp_lesson_progress."completedAt", CASE WHEN :p THEN NOW() ELSE NULL END)`,
      { replacements: { l: l.id, c: l.courseId, s: me.id, sc: score, ans: JSON.stringify(answers), p: passed } },
    );
    const pct = await syncProgress(Number(l.courseId), Number(me.id));
    if (passed && pct === 100) await finishedCourse(req, Number(l.courseId));
    return ok(res, {
      score, passed, passMark: l.passMark, right, total: quiz.length, coursePercent: pct,
      review: quiz.map((x, i) => ({ q: x.q, options: x.options, chosen: answers[i] ?? -1, answer: Number(x.answer), correct: answers[i] === Number(x.answer), explain: x.explain || null })),
    }, passed ? `Well done — ${score}%` : `${score}% — you need ${l.passMark}% to pass. Have another go.`);
  }));

  async function finishedCourse(req: Request, courseId: number) {
    const c = (await q(`SELECT title FROM courses WHERE id = :c`, { c: courseId }))[0];
    await notifyUsers(req, await courseTeachers(courseId), { title: 'A student finished the online lessons', message: `${userName(req)} has completed every lesson in ${c?.title || 'the course'}.`, type: 'Other', actionUrl: `/lms/courses/${courseId}?tab=lessons` }, { excludeSelf: userId(req) });
  }

  return r;
}
