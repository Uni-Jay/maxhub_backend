"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Course_model_1 = require("@models/Course.model");
const CourseModule_model_1 = require("@models/CourseModule.model");
const CourseContent_model_1 = require("@models/CourseContent.model");
const Enrollment_model_1 = require("@models/Enrollment.model");
const Exam_model_1 = require("@models/Exam.model");
const Question_model_1 = require("@models/Question.model");
const ExamResult_model_1 = require("@models/ExamResult.model");
const Staff_model_1 = require("@models/Staff.model");
const User_model_1 = require("@models/User.model");
const Department_model_1 = require("@models/Department.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, status, departmentId, instructorId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (search)
        where.title = { [sequelize_1.Op.like]: `%${search}%` };
    if (status)
        where.status = status;
    if (departmentId)
        where.departmentId = departmentId;
    if (instructorId)
        where.instructorId = instructorId;
    const { count, rows } = await Course_model_1.Course.findAndCountAll({
        where,
        include: [
            { model: Staff_model_1.Staff, as: 'instructor', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email'] }] },
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
        include: [
            { model: Staff_model_1.Staff, as: 'instructor', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email', 'avatar'] }] },
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name'] },
            { model: CourseModule_model_1.CourseModule, as: 'modules', include: [{ model: CourseContent_model_1.CourseContent, as: 'contents' }], order: [['sequence', 'ASC']] },
            { model: Exam_model_1.Exam, as: 'exams', where: { status: 'Published' }, required: false },
        ],
    });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const enrollmentCount = await Enrollment_model_1.Enrollment.count({ where: { courseId: course.id } });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...course.toJSON(), enrollmentCount });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('LMS.COURSE.CREATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { title, courseCode, description, departmentId, instructorId, duration, fee, startDate, endDate, status, certificateRequired, passingScore, maxParticipants, minParticipants } = req.body;
    if (!title || !courseCode || !instructorId || !duration || !startDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title, courseCode, instructorId, duration, startDate are required', 400);
    }
    const existing = await Course_model_1.Course.findOne({ where: { courseCode } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course code already exists', 409);
    const course = await Course_model_1.Course.create({
        uuid: (0, uuid_1.v4)(), title, courseCode, description, departmentId, instructorId,
        duration, fee, startDate, endDate, status: status || 'Draft',
        certificateRequired: certificateRequired ?? false,
        passingScore, maxParticipants, minParticipants,
        createdById: req.user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, course, 'Course created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('LMS.COURSE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const allowed = ['title', 'description', 'departmentId', 'instructorId', 'duration', 'fee',
        'startDate', 'endDate', 'status', 'certificateRequired', 'passingScore', 'maxParticipants', 'minParticipants'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await course.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, course, 'Course updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('LMS.COURSE.DELETE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    await course.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Course deleted');
}));
router.get('/:id/modules', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const modules = await CourseModule_model_1.CourseModule.findAll({
        where: { courseId: course.id },
        include: [{ model: CourseContent_model_1.CourseContent, as: 'contents', order: [['sequence', 'ASC']] }],
        order: [['sequence', 'ASC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, modules);
}));
router.post('/:id/modules', AuthMiddleware_1.default.requirePermission('LMS.COURSE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const { title, description, sequence, duration } = req.body;
    if (!title)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title is required', 400);
    const mod = await CourseModule_model_1.CourseModule.create({
        uuid: (0, uuid_1.v4)(), courseId: course.id, title, description,
        sequence: sequence || 1, duration: duration || 0, status: 'Draft',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, mod, 'Module created', 201);
}));
router.put('/:courseId/modules/:moduleId', AuthMiddleware_1.default.requirePermission('LMS.COURSE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const mod = await CourseModule_model_1.CourseModule.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.moduleId }, { uuid: req.params.moduleId }] },
    });
    if (!mod)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Module not found', 404);
    await mod.update(req.body);
    ResponseFormatter_1.ResponseFormatter.success(res, mod, 'Module updated');
}));
router.delete('/:courseId/modules/:moduleId', AuthMiddleware_1.default.requirePermission('LMS.COURSE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const mod = await CourseModule_model_1.CourseModule.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.moduleId }, { uuid: req.params.moduleId }] },
    });
    if (!mod)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Module not found', 404);
    await mod.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Module deleted');
}));
router.get('/:id/exams', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const exams = await Exam_model_1.Exam.findAll({ where: { courseId: course.id }, include: [{ model: Question_model_1.Question, as: 'questions' }] });
    ResponseFormatter_1.ResponseFormatter.success(res, exams);
}));
router.post('/:id/exams', AuthMiddleware_1.default.requirePermission('LMS.EXAM.CREATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const { examCode, examName, description, totalQuestions, passingScore, duration, attempts } = req.body;
    if (!examCode || !examName || !totalQuestions || !passingScore || !duration) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'examCode, examName, totalQuestions, passingScore, duration are required', 400);
    }
    const exam = await Exam_model_1.Exam.create({
        uuid: (0, uuid_1.v4)(), courseId: course.id, examCode, examName, description,
        totalQuestions, passingScore, duration, attempts: attempts || 1,
        status: 'Draft', createdById: req.user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, exam, 'Exam created', 201);
}));
router.put('/:courseId/exams/:examId', AuthMiddleware_1.default.requirePermission('LMS.EXAM.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const exam = await Exam_model_1.Exam.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.examId }, { uuid: req.params.examId }] } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    await exam.update(req.body);
    ResponseFormatter_1.ResponseFormatter.success(res, exam, 'Exam updated');
}));
router.post('/:courseId/exams/:examId/questions', AuthMiddleware_1.default.requirePermission('LMS.EXAM.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const exam = await Exam_model_1.Exam.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.examId }, { uuid: req.params.examId }] } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const { questionType, questionText, points, sequence, options, correctAnswer, explanation, difficulty } = req.body;
    if (!questionType || !questionText || !correctAnswer) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'questionType, questionText, correctAnswer are required', 400);
    }
    const q = await Question_model_1.Question.create({
        uuid: (0, uuid_1.v4)(), examId: exam.id, questionType, questionText,
        points: points || 1, sequence: sequence || 1,
        options: options ? JSON.stringify(options) : null,
        correctAnswer, explanation, difficulty: difficulty || 'Medium', status: 'Active',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, q, 'Question added', 201);
}));
router.get('/:courseId/exams/:examId/questions', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const exam = await Exam_model_1.Exam.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.examId }, { uuid: req.params.examId }] } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const questions = await Question_model_1.Question.findAll({ where: { examId: exam.id, status: 'Active' }, order: [['sequence', 'ASC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, questions);
}));
router.get('/:id/enrollments', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { courseId: course.id },
        include: [{ model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email', 'avatar'] }] }],
        order: [['enrollmentDate', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, enrollments);
}));
router.get('/:courseId/exams/:examId/results', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const exam = await Exam_model_1.Exam.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.examId }, { uuid: req.params.examId }] } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const results = await ExamResult_model_1.ExamResult.findAll({
        where: { examId: exam.id },
        include: [{ model: Enrollment_model_1.Enrollment, as: 'enrollment', include: [{ model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName'] }] }] }],
        order: [['completedAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, results);
}));
router.get('/stats/overview', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const [total, published, ongoing, completed, totalEnrollments] = await Promise.all([
        Course_model_1.Course.count(),
        Course_model_1.Course.count({ where: { status: 'Published' } }),
        Course_model_1.Course.count({ where: { status: 'Ongoing' } }),
        Course_model_1.Course.count({ where: { status: 'Completed' } }),
        Enrollment_model_1.Enrollment.count(),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, published, ongoing, completed, totalEnrollments });
}));
exports.default = router;
//# sourceMappingURL=course.routes.js.map