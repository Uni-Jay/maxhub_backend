import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Course } from '@models/Course.model';
import { CourseModule } from '@models/CourseModule.model';
import { CourseContent } from '@models/CourseContent.model';
import { Enrollment } from '@models/Enrollment.model';
import { Exam } from '@models/Exam.model';
import { Question } from '@models/Question.model';
import { ExamResult } from '@models/ExamResult.model';
import { Certificate } from '@models/Certificate.model';
import { Staff } from '@models/Staff.model';
import { User } from '@models/User.model';
import { Department } from '@models/Department.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// HOD (and similar) get *_OWN_DEPARTMENT permission variants instead of *_ALL —
// this resolves whether the caller is scoped to their own department only, and
// if so, what that department is. Bypass roles (superadmin/admin/headofadmin)
// and holders of the _ALL permission are never scoped.
function getDeptScope(req: Request, allPermission: string): { scoped: boolean; departmentId: number | null } {
  const user = (req as any).user;
  const normRoles = (user.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  if (normRoles.includes('superadmin') || normRoles.includes('admin') || normRoles.includes('headofadmin')) {
    return { scoped: false, departmentId: null };
  }
  const perms = new Set((user.permissions || []).map((p: string) => p.toLowerCase()));
  if (perms.has(allPermission.toLowerCase())) {
    return { scoped: false, departmentId: null };
  }
  return { scoped: true, departmentId: user.departmentId ?? null };
}

// ─── COURSES ──────────────────────────────────────────────────────────────────

// GET /api/courses — list all courses
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search, status, departmentId, instructorId } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) where.title = { [Op.iLike]: `%${search}%` };
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (instructorId) where.instructorId = instructorId;

  const { count, rows } = await Course.findAndCountAll({
    where,
    include: [
      { model: Staff, as: 'instructor', include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }] },
      { model: Department, as: 'department', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/courses/:id — single course with modules
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
    include: [
      { model: Staff, as: 'instructor', include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'avatar'] }] },
      { model: Department, as: 'department', attributes: ['id', 'name'] },
      { model: CourseModule, as: 'modules', include: [{ model: CourseContent, as: 'contents' }], order: [['sequence', 'ASC']] },
      { model: Exam, as: 'exams', where: { status: 'Published' }, required: false },
    ],
  });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);
  const enrollmentCount = await Enrollment.count({ where: { courseId: course.id } });
  ResponseFormatter.success(res, { ...course.toJSON(), enrollmentCount });
}));

// POST /api/courses — create course
router.post('/', AuthMiddleware.requirePermission('LMS.COURSE.CREATE.ALL', 'LMS.COURSE.CREATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { title, courseCode, description, instructorId, instructorName, duration, fee,
    startDate, endDate, status, certificateRequired, passingScore, maxParticipants, minParticipants } = req.body;

  if (!title || !courseCode || !instructorName || !duration || !startDate) {
    return ResponseFormatter.error(res, 'title, courseCode, instructorName, duration, startDate are required', 400);
  }

  const scope = getDeptScope(req, 'lms.course.create.all');
  let { departmentId } = req.body;
  if (scope.scoped) {
    if (!scope.departmentId) return ResponseFormatter.error(res, 'No department assigned to your account', 403);
    departmentId = scope.departmentId; // ignore any client-supplied departmentId — always her own
  }

  const existing = await Course.findOne({ where: { courseCode } });
  if (existing) return ResponseFormatter.error(res, 'Course code already exists', 409);

  const course = await Course.create({
    uuid: uuidv4(), title, courseCode, description, departmentId, instructorId: instructorId || undefined, instructorName,
    duration, fee, startDate, endDate, status: status || 'Draft',
    certificateRequired: certificateRequired ?? false,
    passingScore, maxParticipants, minParticipants,
    createdById: (req as any).user.id,
  } as any);

  ResponseFormatter.success(res, course, 'Course created', 201);
}));

// PUT /api/courses/:id — update course
router.put('/:id', AuthMiddleware.requirePermission('LMS.COURSE.UPDATE.ALL', 'LMS.COURSE.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const scope = getDeptScope(req, 'lms.course.update.all');
  if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
    return ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
  }

  const allowed = ['title', 'description', 'departmentId', 'instructorId', 'instructorName', 'duration', 'fee',
    'startDate', 'endDate', 'status', 'certificateRequired', 'passingScore', 'maxParticipants', 'minParticipants'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (scope.scoped) delete updates.departmentId; // dept-scoped callers can't move a course out of their department

  await course.update(updates);
  ResponseFormatter.success(res, course, 'Course updated');
}));

// DELETE /api/courses/:id — soft delete
router.delete('/:id', AuthMiddleware.requirePermission('LMS.COURSE.DELETE.ALL', 'LMS.COURSE.DELETE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const scope = getDeptScope(req, 'lms.course.delete.all');
  if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
    return ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
  }

  await course.destroy();
  ResponseFormatter.success(res, null, 'Course deleted');
}));

// ─── COURSE MODULES ───────────────────────────────────────────────────────────

// GET /api/courses/:id/modules
router.get('/:id/modules', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const modules = await CourseModule.findAll({
    where: { courseId: course.id },
    include: [{ model: CourseContent, as: 'contents', order: [['sequence', 'ASC']] }],
    order: [['sequence', 'ASC']],
  });
  ResponseFormatter.success(res, modules);
}));

// POST /api/courses/:id/modules — add module
router.post('/:id/modules', AuthMiddleware.requirePermission('LMS.COURSE.UPDATE.ALL', 'LMS.COURSE.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const scope = getDeptScope(req, 'lms.course.update.all');
  if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
    return ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
  }

  const { title, description, sequence, duration } = req.body;
  if (!title) return ResponseFormatter.error(res, 'title is required', 400);

  const moduleCount = await CourseModule.count({ where: { courseId: course.id } });
  const mod = await CourseModule.create({
    uuid: uuidv4(), courseId: course.id,
    moduleCode: `${course.courseCode}-M${moduleCount + 1}`, moduleName: title, description,
    sequence: sequence || moduleCount + 1, duration: duration || 0, status: 'Draft',
  } as any);
  ResponseFormatter.success(res, mod, 'Module created', 201);
}));

// PUT /api/courses/:courseId/modules/:moduleId
router.put('/:courseId/modules/:moduleId', AuthMiddleware.requirePermission('LMS.COURSE.UPDATE.ALL', 'LMS.COURSE.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const mod = await CourseModule.findOne({
    where: { ...idOrUuidWhere(req.params.moduleId) },
  });
  if (!mod) return ResponseFormatter.error(res, 'Module not found', 404);

  const scope = getDeptScope(req, 'lms.course.update.all');
  if (scope.scoped) {
    const course = await Course.findByPk(mod.courseId);
    if (!course || String(course.departmentId) !== String(scope.departmentId)) {
      return ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
    }
  }

  await mod.update(req.body);
  ResponseFormatter.success(res, mod, 'Module updated');
}));

// DELETE /api/courses/:courseId/modules/:moduleId
router.delete('/:courseId/modules/:moduleId', AuthMiddleware.requirePermission('LMS.COURSE.UPDATE.ALL', 'LMS.COURSE.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const mod = await CourseModule.findOne({
    where: { ...idOrUuidWhere(req.params.moduleId) },
  });
  if (!mod) return ResponseFormatter.error(res, 'Module not found', 404);

  const scope = getDeptScope(req, 'lms.course.update.all');
  if (scope.scoped) {
    const course = await Course.findByPk(mod.courseId);
    if (!course || String(course.departmentId) !== String(scope.departmentId)) {
      return ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
    }
  }

  await mod.destroy();
  ResponseFormatter.success(res, null, 'Module deleted');
}));

// ─── EXAMS ────────────────────────────────────────────────────────────────────

// GET /api/courses/student/exams — all exams for the current user's enrolled courses
router.get('/student/exams', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return ResponseFormatter.error(res, 'Unauthorized', 401);

  // Get enrollments for this user via their Staff record
  const staffRecord = await Staff.findOne({ where: { userId }, attributes: ['id'] });
  if (!staffRecord) return ResponseFormatter.success(res, [], 'No exams found');
  const enrollments = await Enrollment.findAll({
    where: { staffId: (staffRecord as any).id },
    attributes: ['id', 'courseId', 'status'],
  });

  const courseIds = [...new Set(enrollments.map((e: any) => e.courseId))];
  if (courseIds.length === 0) {
    return ResponseFormatter.success(res, [], 'No exams found');
  }

  const exams = await Exam.findAll({
    where: { courseId: { [Op.in]: courseIds }, status: { [Op.in]: ['Published', 'Draft'] } },
    include: [{ model: Course, as: 'course', attributes: ['id', 'courseCode', 'courseName'] }],
    order: [['createdAt', 'DESC']],
  });

  // Get exam results for this user
  const examIds = exams.map(e => e.id);
  const results = examIds.length > 0 ? await ExamResult.findAll({
    where: { examId: { [Op.in]: examIds } },
    order: [['attemptNumber', 'DESC']],
  }) : [];

  const resultMap: Record<string, any[]> = {};
  results.forEach((r: any) => {
    const key = String(r.examId);
    if (!resultMap[key]) resultMap[key] = [];
    resultMap[key].push(r);
  });

  const now = new Date();
  const output = exams.map(exam => {
    const myResults = resultMap[String(exam.id)] ?? [];
    const bestResult = myResults.sort((a: any, b: any) => b.score - a.score)[0];
    const attemptCount = myResults.length;
    let status: string;
    if (attemptCount >= exam.attempts) {
      status = bestResult?.score >= exam.passingScore ? 'completed' : 'missed';
    } else if (attemptCount > 0) {
      status = 'completed';
    } else {
      status = exam.status === 'Published' ? 'available' : 'upcoming';
    }
    return {
      id: Number(exam.id),
      title: exam.examName,
      course: (exam as any).course?.courseName ?? 'Unknown Course',
      duration: `${exam.duration} min`,
      questions: exam.totalQuestions,
      date: exam.createdAt?.toISOString?.()?.slice(0, 10) ?? '',
      status,
      score: bestResult ? Number(bestResult.score) : undefined,
      maxScore: 100,
      attempts: attemptCount,
      maxAttempts: exam.attempts,
      examCode: exam.examCode,
      passingScore: exam.passingScore,
    };
  });

  ResponseFormatter.success(res, output, 'Exams retrieved');
}));

// ─── STUDENT SELF-SERVICE ──────────────────────────────────────────────────────

// GET /api/courses/student/enrollments
router.get('/student/enrollments', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return ResponseFormatter.error(res, 'Unauthorized', 401);

  const staff = await Staff.findOne({ where: { userId }, attributes: ['id'] });
  if (!staff) return ResponseFormatter.success(res, [], 'No enrollments found');

  const enrollments = await Enrollment.findAll({
    where: { staffId: staff.id },
    include: [{ model: Course, as: 'course', attributes: ['id', 'uuid', 'courseCode', 'courseName', 'description', 'duration', 'instructor', 'thumbnail', 'status'] }],
    order: [['enrollmentDate', 'DESC']],
  });

  const result = enrollments.map((e: any) => ({
    id: Number(e.id),
    courseId: Number(e.courseId),
    title: e.course?.courseName ?? 'Unknown Course',
    instructor: e.course?.instructor ?? '',
    progress: Number(e.progressPercentage) ?? 0,
    totalLessons: 0,
    doneLessons: 0,
    enrolledDate: e.enrollmentDate?.toISOString?.()?.slice(0, 10) ?? '',
    completedDate: e.completionDate?.toISOString?.()?.slice(0, 10) ?? null,
    status: e.status,
    thumbnail: e.course?.thumbnail ?? null,
  }));

  ResponseFormatter.success(res, result, 'Enrollments retrieved');
}));

// GET /api/courses/student/certificates
router.get('/student/certificates', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return ResponseFormatter.error(res, 'Unauthorized', 401);

  const staff = await Staff.findOne({ where: { userId }, attributes: ['id'] });
  if (!staff) return ResponseFormatter.success(res, [], 'No certificates found');

  const enrollments = await Enrollment.findAll({
    where: { staffId: staff.id },
    attributes: ['id'],
  });
  const enrollmentIds = enrollments.map(e => e.id);
  if (enrollmentIds.length === 0) return ResponseFormatter.success(res, [], 'No certificates found');

  const certs = await Certificate.findAll({
    where: { enrollmentId: { [Op.in]: enrollmentIds }, status: 'Issued' },
    include: [{
      model: Enrollment,
      as: 'enrollment',
      include: [{ model: Course, as: 'course', attributes: ['courseName', 'instructor'] }],
    }],
    order: [['issuedDate', 'DESC']],
  });

  const result = certs.map((c: any) => ({
    id: Number(c.id),
    credentialId: c.certificateCode,
    title: c.certificateName || 'Certificate of Completion',
    course: c.enrollment?.course?.courseName ?? 'Unknown Course',
    instructor: c.enrollment?.course?.instructor ?? '',
    issueDate: c.issuedDate?.toISOString?.()?.slice(0, 10) ?? '',
    status: c.status,
    certificateUrl: c.certificateUrl ?? null,
    verificationCode: c.verificationCode,
  }));

  ResponseFormatter.success(res, result, 'Certificates retrieved');
}));

// GET /api/courses/exams/:examId/leaderboard
router.get('/exams/:examId/leaderboard', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const exam = await Exam.findOne({ where: { [Op.or]: [{ id: examId }, { uuid: examId }] } });
  if (!exam) return ResponseFormatter.error(res, 'Exam not found', 404);

  const results = await ExamResult.findAll({
    where: { examId: exam.id, status: { [Op.in]: ['Passed', 'Failed', 'Submitted'] } },
    include: [{
      model: Enrollment,
      as: 'enrollment',
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName'] }],
    }],
    order: [['score', 'DESC']],
  });

  const ranked = results.map((r: any, idx: number) => {
    const staff = r.enrollment?.staff;
    const name = staff ? `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim() : `Student #${r.enrollmentId}`;
    const secs = r.completedAt && r.startedAt
      ? Math.round((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
      : 0;
    const mins = Math.floor(secs / 60);
    const sec2 = secs % 60;
    return {
      id: Number(r.id),
      rank: idx + 1,
      name,
      score: Number(r.correctAnswers ?? 0),
      maxScore: Number(r.totalQuestions ?? 0),
      percentage: Number(r.score),
      status: r.status === 'Passed' ? 'Pass' : 'Fail',
      timeTaken: `${String(mins).padStart(2, '0')}:${String(sec2).padStart(2, '0')}`,
      timeTakenSecs: secs,
    };
  });

  const myEnrollment = await (async () => {
    const userId = (req as any).user?.id;
    if (!userId) return null;
    const staff = await Staff.findOne({ where: { userId }, attributes: ['id'] });
    if (!staff) return null;
    const enr = await Enrollment.findOne({ where: { staffId: staff.id, courseId: exam.courseId } });
    return enr ? results.find((r: any) => String(r.enrollmentId) === String(enr.id)) : null;
  })();

  ResponseFormatter.success(res, {
    exam: { id: Number(exam.id), title: exam.examName, date: exam.createdAt, passingScore: exam.passingScore },
    rankings: ranked,
    myResult: myEnrollment ? {
      score: Number((myEnrollment as any).score),
      status: (myEnrollment as any).status,
      answers: (myEnrollment as any).answers ?? null,
    } : null,
  }, 'Leaderboard retrieved');
}));

// GET /api/courses/:id/exams
router.get('/:id/exams', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);
  const exams = await Exam.findAll({ where: { courseId: course.id }, include: [{ model: Question, as: 'questions' }] });
  ResponseFormatter.success(res, exams);
}));

// POST /api/courses/:id/exams — create exam
router.post('/:id/exams', AuthMiddleware.requirePermission('LMS.EXAM.CREATE.ALL', 'LMS.EXAM.CREATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const scope = getDeptScope(req, 'lms.exam.create.all');
  if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
    return ResponseFormatter.error(res, 'You can only manage exams for courses in your own department', 403);
  }

  const { examCode, examName, description, totalQuestions, passingScore, duration, attempts } = req.body;
  if (!examCode || !examName || !totalQuestions || !passingScore || !duration) {
    return ResponseFormatter.error(res, 'examCode, examName, totalQuestions, passingScore, duration are required', 400);
  }

  const exam = await Exam.create({
    uuid: uuidv4(), courseId: course.id, examCode, examName, description,
    totalQuestions, passingScore, duration, attempts: attempts || 1,
    status: 'Draft', createdById: (req as any).user.id,
  } as any);
  ResponseFormatter.success(res, exam, 'Exam created', 201);
}));

// PUT /api/courses/:courseId/exams/:examId
router.put('/:courseId/exams/:examId', AuthMiddleware.requirePermission('LMS.EXAM.UPDATE.ALL', 'LMS.EXAM.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findOne({ where: { ...idOrUuidWhere(req.params.examId) } });
  if (!exam) return ResponseFormatter.error(res, 'Exam not found', 404);

  const scope = getDeptScope(req, 'lms.exam.update.all');
  if (scope.scoped) {
    const course = await Course.findByPk(exam.courseId);
    if (!course || String(course.departmentId) !== String(scope.departmentId)) {
      return ResponseFormatter.error(res, 'You can only manage exams for courses in your own department', 403);
    }
  }

  await exam.update(req.body);
  ResponseFormatter.success(res, exam, 'Exam updated');
}));

// POST /api/courses/:courseId/exams/:examId/questions — add question
router.post('/:courseId/exams/:examId/questions', AuthMiddleware.requirePermission('LMS.EXAM.UPDATE.ALL', 'LMS.EXAM.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findOne({ where: { ...idOrUuidWhere(req.params.examId) } });
  if (!exam) return ResponseFormatter.error(res, 'Exam not found', 404);

  const scope = getDeptScope(req, 'lms.exam.update.all');
  if (scope.scoped) {
    const course = await Course.findByPk(exam.courseId);
    if (!course || String(course.departmentId) !== String(scope.departmentId)) {
      return ResponseFormatter.error(res, 'You can only manage exams for courses in your own department', 403);
    }
  }

  const { questionType, questionText, points, sequence, options, correctAnswer, explanation, difficulty } = req.body;
  if (!questionType || !questionText || !correctAnswer) {
    return ResponseFormatter.error(res, 'questionType, questionText, correctAnswer are required', 400);
  }

  const q = await Question.create({
    uuid: uuidv4(), examId: exam.id, questionType, questionText,
    points: points || 1, sequence: sequence || 1,
    options: options ? JSON.stringify(options) : null,
    correctAnswer, explanation, difficulty: difficulty || 'Medium', status: 'Active',
  } as any);
  ResponseFormatter.success(res, q, 'Question added', 201);
}));

// GET /api/courses/:courseId/exams/:examId/questions
router.get('/:courseId/exams/:examId/questions', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findOne({ where: { ...idOrUuidWhere(req.params.examId) } });
  if (!exam) return ResponseFormatter.error(res, 'Exam not found', 404);
  const questions = await Question.findAll({ where: { examId: exam.id, status: 'Active' }, order: [['sequence', 'ASC']] });
  ResponseFormatter.success(res, questions);
}));

// DELETE /api/courses/:courseId/exams/:examId/questions/:questionId
router.delete('/:courseId/exams/:examId/questions/:questionId', AuthMiddleware.requirePermission('LMS.EXAM.UPDATE.ALL', 'LMS.EXAM.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findOne({ where: { ...idOrUuidWhere(req.params.examId) } });
  if (!exam) return ResponseFormatter.error(res, 'Exam not found', 404);

  const scope = getDeptScope(req, 'lms.exam.update.all');
  if (scope.scoped) {
    const course = await Course.findByPk(exam.courseId);
    if (!course || String(course.departmentId) !== String(scope.departmentId)) {
      return ResponseFormatter.error(res, 'You can only manage exams for courses in your own department', 403);
    }
  }

  const question = await Question.findOne({ where: { ...idOrUuidWhere(req.params.questionId), examId: exam.id } });
  if (!question) return ResponseFormatter.error(res, 'Question not found', 404);
  await question.update({ status: 'Archived' });
  ResponseFormatter.success(res, null, 'Question removed');
}));

// ─── ENROLLMENTS VIA COURSE ───────────────────────────────────────────────────

// GET /api/courses/:id/enrollments
router.get('/:id/enrollments', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);
  const enrollments = await Enrollment.findAll({
    where: { courseId: course.id },
    include: [{ model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'avatar'] }] }],
    order: [['enrollmentDate', 'DESC']],
  });
  ResponseFormatter.success(res, enrollments);
}));

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────

// GET /api/courses/:id/certificates — certificates issued for a course
router.get('/:id/certificates', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const enrollments = await Enrollment.findAll({ where: { courseId: course.id }, attributes: ['id'] });
  const enrollmentIds = enrollments.map(e => e.id);
  if (enrollmentIds.length === 0) return ResponseFormatter.success(res, []);

  const certs = await Certificate.findAll({
    where: { enrollmentId: { [Op.in]: enrollmentIds } },
    include: [{ model: Enrollment, as: 'enrollment', include: [{ model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }] }] }],
    order: [['issuedDate', 'DESC']],
  });
  ResponseFormatter.success(res, certs);
}));

// POST /api/courses/enrollments/:enrollmentId/certificate — issue a certificate
router.post('/enrollments/:enrollmentId/certificate', AuthMiddleware.requirePermission('LMS.CERTIFICATE.ISSUE.ALL', 'LMS.CERTIFICATE.ISSUE.OWN_DEPARTMENT'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findOne({ where: { ...idOrUuidWhere(req.params.enrollmentId) } });
  if (!enrollment) return ResponseFormatter.error(res, 'Enrollment not found', 404);

  const course = await Course.findByPk(enrollment.courseId);
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);

  const scope = getDeptScope(req, 'lms.certificate.issue.all');
  if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
    return ResponseFormatter.error(res, 'You can only issue certificates for courses in your own department', 403);
  }

  if (enrollment.status !== 'Completed') {
    return ResponseFormatter.error(res, 'Enrollment must be Completed before a certificate can be issued', 400);
  }

  const existing = await Certificate.findOne({ where: { enrollmentId: enrollment.id, status: 'Issued' } });
  if (existing) return ResponseFormatter.error(res, 'A certificate has already been issued for this enrollment', 409);

  const { certificateName } = req.body;
  const code = `CERT-${course.courseCode}-${Date.now().toString(36).toUpperCase()}`;
  const certificate = await Certificate.create({
    uuid: uuidv4(), enrollmentId: enrollment.id,
    certificateCode: code, certificateName: certificateName || `Certificate of Completion — ${course.title}`,
    issuedDate: new Date(), verificationCode: uuidv4().slice(0, 8).toUpperCase(),
    status: 'Issued',
  } as any);

  ResponseFormatter.success(res, certificate, 'Certificate issued', 201);
}));

// ─── EXAM RESULTS ─────────────────────────────────────────────────────────────

// GET /api/courses/:courseId/exams/:examId/results
router.get('/:courseId/exams/:examId/results', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findOne({ where: { ...idOrUuidWhere(req.params.examId) } });
  if (!exam) return ResponseFormatter.error(res, 'Exam not found', 404);
  const results = await ExamResult.findAll({
    where: { examId: exam.id },
    include: [{ model: Enrollment, as: 'enrollment', include: [{ model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName'] }] }] }],
    order: [['completedAt', 'DESC']],
  });
  ResponseFormatter.success(res, results);
}));

// ─── STATS ────────────────────────────────────────────────────────────────────

// GET /api/courses/stats/overview
router.get('/stats/overview', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const [total, published, ongoing, completed, totalEnrollments] = await Promise.all([
    Course.count(),
    Course.count({ where: { status: 'Published' } }),
    Course.count({ where: { status: 'Ongoing' } }),
    Course.count({ where: { status: 'Completed' } }),
    Enrollment.count(),
  ]);
  ResponseFormatter.success(res, { total, published, ongoing, completed, totalEnrollments });
}));

export default router;
