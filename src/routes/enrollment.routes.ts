import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Enrollment } from '@models/Enrollment.model';
import { Course } from '@models/Course.model';
import { Staff } from '@models/Staff.model';
import { User } from '@models/User.model';
import { Exam } from '@models/Exam.model';
import { Question } from '@models/Question.model';
import { ExamResult } from '@models/ExamResult.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// GET /api/enrollments — list all enrollments (admin)
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, courseId, staffId } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (courseId) where.courseId = courseId;
  if (staffId) where.staffId = staffId;

  const { count, rows } = await Enrollment.findAndCountAll({
    where,
    include: [
      { model: Course, as: 'course', attributes: ['id', 'uuid', 'title', 'courseCode', 'status'] },
      { model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'avatar'] }] },
    ],
    order: [['enrollmentDate', 'DESC']],
    limit: Number(limit),
    offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// POST /api/enrollments — enroll a staff member
router.post('/', AuthMiddleware.requirePermission('LMS.ENROLLMENT.CREATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { courseId, staffId, notes } = req.body;
  if (!courseId || !staffId) return ResponseFormatter.error(res, 'courseId and staffId are required', 400);

  const course = await Course.findByPk(courseId);
  if (!course) return ResponseFormatter.error(res, 'Course not found', 404);
  if (course.status === 'Cancelled') return ResponseFormatter.error(res, 'Cannot enroll in a cancelled course', 400);

  const existing = await Enrollment.findOne({ where: { courseId, staffId } });
  if (existing && existing.status !== 'Dropped') return ResponseFormatter.error(res, 'Already enrolled', 409);

  if (existing) {
    await existing.update({ status: 'Enrolled', progressPercentage: 0, enrollmentDate: new Date(), notes });
    return ResponseFormatter.success(res, existing, 'Re-enrolled', 201);
  }

  const enrollment = await Enrollment.create({
    uuid: uuidv4(), courseId, staffId, enrollmentDate: new Date(),
    status: 'Enrolled', progressPercentage: 0, notes,
  } as any);
  ResponseFormatter.success(res, enrollment, 'Enrolled successfully', 201);
}));

// GET /api/enrollments/my — logged-in user's own enrollments
router.get('/my', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const staff = await Staff.findOne({ where: { userId: user.id } });
  if (!staff) return ResponseFormatter.error(res, 'No staff profile found', 404);

  const enrollments = await Enrollment.findAll({
    where: { staffId: staff.id },
    include: [{ model: Course, as: 'course', include: [{ model: Staff, as: 'instructor', include: [{ model: User, attributes: ['firstName', 'lastName'] }] }] }],
    order: [['enrollmentDate', 'DESC']],
  });
  ResponseFormatter.success(res, enrollments);
}));

// GET /api/enrollments/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
    include: [
      { model: Course, as: 'course' },
      { model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }] },
    ],
  });
  if (!enrollment) return ResponseFormatter.error(res, 'Enrollment not found', 404);
  ResponseFormatter.success(res, enrollment);
}));

// PATCH /api/enrollments/:id/progress
router.patch('/:id/progress', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!enrollment) return ResponseFormatter.error(res, 'Enrollment not found', 404);

  const pct = Math.min(100, Math.max(0, Number(req.body.progressPercentage)));
  const updates: any = { progressPercentage: pct };
  if (pct === 100 && enrollment.status === 'InProgress') { updates.status = 'Completed'; updates.completionDate = new Date(); }
  else if (pct > 0 && enrollment.status === 'Enrolled') { updates.status = 'InProgress'; }

  await enrollment.update(updates);
  ResponseFormatter.success(res, enrollment, 'Progress updated');
}));

// PATCH /api/enrollments/:id/status
router.patch('/:id/status', AuthMiddleware.requirePermission('LMS.ENROLLMENT.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!enrollment) return ResponseFormatter.error(res, 'Enrollment not found', 404);
  const { status, notes } = req.body;
  if (!['Enrolled', 'InProgress', 'Completed', 'Failed', 'Dropped', 'OnHold'].includes(status)) return ResponseFormatter.error(res, 'Invalid status', 400);
  await enrollment.update({ status, notes, completionDate: status === 'Completed' ? new Date() : enrollment.completionDate });
  ResponseFormatter.success(res, enrollment, 'Status updated');
}));

// POST /api/enrollments/:id/exams/:examId/start — start CBT exam
router.post('/:id/exams/:examId/start', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!enrollment) return ResponseFormatter.error(res, 'Enrollment not found', 404);

  const exam = await Exam.findOne({ where: { ...idOrUuidWhere(req.params.examId), status: 'Published' } });
  if (!exam) return ResponseFormatter.error(res, 'Exam not found or not published', 404);

  const attemptCount = await ExamResult.count({ where: { examId: exam.id, enrollmentId: enrollment.id } });
  if (attemptCount >= exam.attempts) return ResponseFormatter.error(res, `Max ${exam.attempts} attempt(s) reached`, 400);

  const active = await ExamResult.findOne({ where: { examId: exam.id, enrollmentId: enrollment.id, status: 'InProgress' } });
  if (active) {
    const questions = await Question.findAll({ where: { examId: exam.id, status: 'Active' }, order: [['sequence', 'ASC']] });
    const safeQs = questions.map(q => ({ id: q.id, uuid: q.uuid, questionType: q.questionType, questionText: q.questionText, points: q.points, sequence: q.sequence, options: q.options ? JSON.parse(q.options as string) : null, difficulty: q.difficulty }));
    return ResponseFormatter.success(res, { result: active, questions: safeQs, duration: exam.duration });
  }

  const result = await ExamResult.create({
    uuid: uuidv4(), examId: exam.id, enrollmentId: enrollment.id,
    attemptNumber: attemptCount + 1, startedAt: new Date(),
    totalQuestions: exam.totalQuestions, correctAnswers: 0,
    score: 0, passingScore: exam.passingScore, status: 'InProgress',
  } as any);

  const questions = await Question.findAll({ where: { examId: exam.id, status: 'Active' }, order: [['sequence', 'ASC']] });
  const safeQs = questions.map(q => ({ id: q.id, uuid: q.uuid, questionType: q.questionType, questionText: q.questionText, points: q.points, sequence: q.sequence, options: q.options ? JSON.parse(q.options as string) : null, difficulty: q.difficulty }));

  ResponseFormatter.success(res, { result, questions: safeQs, duration: exam.duration }, 'Exam started', 201);
}));

// POST /api/enrollments/:id/exams/:examId/submit — submit answers
router.post('/:id/exams/:examId/submit', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!enrollment) return ResponseFormatter.error(res, 'Enrollment not found', 404);

  const exam = await Exam.findByPk(req.params.examId);
  if (!exam) return ResponseFormatter.error(res, 'Exam not found', 404);

  const attempt = await ExamResult.findOne({ where: { examId: exam.id, enrollmentId: enrollment.id, status: 'InProgress' } });
  if (!attempt) return ResponseFormatter.error(res, 'No active attempt found', 404);

  const { answers } = req.body;
  if (!answers) return ResponseFormatter.error(res, 'answers object required', 400);

  const questions = await Question.findAll({ where: { examId: exam.id, status: 'Active' } });
  let correct = 0; let totalPts = 0; let earned = 0;
  for (const q of questions) {
    totalPts += q.points;
    const ans = answers[String(q.id)];
    if (ans && ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) { correct++; earned += q.points; }
  }

  const score = totalPts > 0 ? Math.round((earned / totalPts) * 100) : 0;
  const passed = score >= exam.passingScore;
  await attempt.update({ correctAnswers: correct, score, completedAt: new Date(), status: passed ? 'Passed' : 'Failed', answers: JSON.stringify(answers), totalQuestions: questions.length });

  ResponseFormatter.success(res, { score, correctAnswers: correct, totalQuestions: questions.length, passingScore: exam.passingScore, passed, status: attempt.status }, passed ? 'Exam passed!' : 'Exam failed');
}));

export default router;
