"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Enrollment_model_1 = require("../models/Enrollment.model");
const Course_model_1 = require("../models/Course.model");
const Staff_model_1 = require("../models/Staff.model");
const User_model_1 = require("../models/User.model");
const Exam_model_1 = require("../models/Exam.model");
const Question_model_1 = require("../models/Question.model");
const ExamResult_model_1 = require("../models/ExamResult.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, courseId, staffId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (courseId)
        where.courseId = courseId;
    if (staffId)
        where.staffId = staffId;
    const { count, rows } = await Enrollment_model_1.Enrollment.findAndCountAll({
        where,
        include: [
            { model: Course_model_1.Course, as: 'course', attributes: ['id', 'uuid', 'title', 'courseCode', 'status'] },
            { model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email', 'avatar'] }] },
        ],
        order: [['enrollmentDate', 'DESC']],
        limit: Number(limit),
        offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.post('/', AuthMiddleware_1.default.requirePermission('LMS.ENROLLMENT.CREATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { courseId, staffId, notes } = req.body;
    if (!courseId || !staffId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'courseId and staffId are required', 400);
    const course = await Course_model_1.Course.findByPk(courseId);
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    if (course.status === 'Cancelled')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Cannot enroll in a cancelled course', 400);
    const existing = await Enrollment_model_1.Enrollment.findOne({ where: { courseId, staffId } });
    if (existing && existing.status !== 'Dropped')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Already enrolled', 409);
    if (existing) {
        await existing.update({ status: 'Enrolled', progressPercentage: 0, enrollmentDate: new Date(), notes });
        return ResponseFormatter_1.ResponseFormatter.success(res, existing, 'Re-enrolled', 201);
    }
    const enrollment = await Enrollment_model_1.Enrollment.create({
        uuid: (0, uuid_1.v4)(), courseId, staffId, enrollmentDate: new Date(),
        status: 'Enrolled', progressPercentage: 0, notes,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, enrollment, 'Enrolled successfully', 201);
}));
router.get('/my', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const staff = await Staff_model_1.Staff.findOne({ where: { userId: user.id } });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'No staff profile found', 404);
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { staffId: staff.id },
        include: [{ model: Course_model_1.Course, as: 'course', include: [{ model: Staff_model_1.Staff, as: 'instructor', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName'] }] }] }],
        order: [['enrollmentDate', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, enrollments);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const enrollment = await Enrollment_model_1.Enrollment.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
        include: [
            { model: Course_model_1.Course, as: 'course' },
            { model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email'] }] },
        ],
    });
    if (!enrollment)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Enrollment not found', 404);
    ResponseFormatter_1.ResponseFormatter.success(res, enrollment);
}));
router.patch('/:id/progress', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const enrollment = await Enrollment_model_1.Enrollment.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!enrollment)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Enrollment not found', 404);
    const pct = Math.min(100, Math.max(0, Number(req.body.progressPercentage)));
    const updates = { progressPercentage: pct };
    if (pct === 100 && enrollment.status === 'InProgress') {
        updates.status = 'Completed';
        updates.completionDate = new Date();
    }
    else if (pct > 0 && enrollment.status === 'Enrolled') {
        updates.status = 'InProgress';
    }
    await enrollment.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, enrollment, 'Progress updated');
}));
router.patch('/:id/status', AuthMiddleware_1.default.requirePermission('LMS.ENROLLMENT.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const enrollment = await Enrollment_model_1.Enrollment.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!enrollment)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Enrollment not found', 404);
    const { status, notes } = req.body;
    if (!['Enrolled', 'InProgress', 'Completed', 'Failed', 'Dropped', 'OnHold'].includes(status))
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invalid status', 400);
    await enrollment.update({ status, notes, completionDate: status === 'Completed' ? new Date() : enrollment.completionDate });
    ResponseFormatter_1.ResponseFormatter.success(res, enrollment, 'Status updated');
}));
router.post('/:id/exams/:examId/start', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const enrollment = await Enrollment_model_1.Enrollment.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!enrollment)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Enrollment not found', 404);
    const exam = await Exam_model_1.Exam.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.examId }, { uuid: req.params.examId }], status: 'Published' } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found or not published', 404);
    const attemptCount = await ExamResult_model_1.ExamResult.count({ where: { examId: exam.id, enrollmentId: enrollment.id } });
    if (attemptCount >= exam.attempts)
        return ResponseFormatter_1.ResponseFormatter.error(res, `Max ${exam.attempts} attempt(s) reached`, 400);
    const active = await ExamResult_model_1.ExamResult.findOne({ where: { examId: exam.id, enrollmentId: enrollment.id, status: 'InProgress' } });
    if (active) {
        const questions = await Question_model_1.Question.findAll({ where: { examId: exam.id, status: 'Active' }, order: [['sequence', 'ASC']] });
        const safeQs = questions.map(q => ({ id: q.id, uuid: q.uuid, questionType: q.questionType, questionText: q.questionText, points: q.points, sequence: q.sequence, options: q.options ? JSON.parse(q.options) : null, difficulty: q.difficulty }));
        return ResponseFormatter_1.ResponseFormatter.success(res, { result: active, questions: safeQs, duration: exam.duration });
    }
    const result = await ExamResult_model_1.ExamResult.create({
        uuid: (0, uuid_1.v4)(), examId: exam.id, enrollmentId: enrollment.id,
        attemptNumber: attemptCount + 1, startedAt: new Date(),
        totalQuestions: exam.totalQuestions, correctAnswers: 0,
        score: 0, passingScore: exam.passingScore, status: 'InProgress',
    });
    const questions = await Question_model_1.Question.findAll({ where: { examId: exam.id, status: 'Active' }, order: [['sequence', 'ASC']] });
    const safeQs = questions.map(q => ({ id: q.id, uuid: q.uuid, questionType: q.questionType, questionText: q.questionText, points: q.points, sequence: q.sequence, options: q.options ? JSON.parse(q.options) : null, difficulty: q.difficulty }));
    ResponseFormatter_1.ResponseFormatter.success(res, { result, questions: safeQs, duration: exam.duration }, 'Exam started', 201);
}));
router.post('/:id/exams/:examId/submit', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const enrollment = await Enrollment_model_1.Enrollment.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!enrollment)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Enrollment not found', 404);
    const exam = await Exam_model_1.Exam.findByPk(req.params.examId);
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const attempt = await ExamResult_model_1.ExamResult.findOne({ where: { examId: exam.id, enrollmentId: enrollment.id, status: 'InProgress' } });
    if (!attempt)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'No active attempt found', 404);
    const { answers } = req.body;
    if (!answers)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'answers object required', 400);
    const questions = await Question_model_1.Question.findAll({ where: { examId: exam.id, status: 'Active' } });
    let correct = 0;
    let totalPts = 0;
    let earned = 0;
    for (const q of questions) {
        totalPts += q.points;
        const ans = answers[String(q.id)];
        if (ans && ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            correct++;
            earned += q.points;
        }
    }
    const score = totalPts > 0 ? Math.round((earned / totalPts) * 100) : 0;
    const passed = score >= exam.passingScore;
    await attempt.update({ correctAnswers: correct, score, completedAt: new Date(), status: passed ? 'Passed' : 'Failed', answers: JSON.stringify(answers), totalQuestions: questions.length });
    ResponseFormatter_1.ResponseFormatter.success(res, { score, correctAnswers: correct, totalQuestions: questions.length, passingScore: exam.passingScore, passed, status: attempt.status }, passed ? 'Exam passed!' : 'Exam failed');
}));
exports.default = router;
//# sourceMappingURL=enrollment.routes.js.map