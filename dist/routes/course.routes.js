"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Course_model_1 = require("../models/Course.model");
const CourseModule_model_1 = require("../models/CourseModule.model");
const CourseContent_model_1 = require("../models/CourseContent.model");
const Enrollment_model_1 = require("../models/Enrollment.model");
const Exam_model_1 = require("../models/Exam.model");
const Question_model_1 = require("../models/Question.model");
const ExamResult_model_1 = require("../models/ExamResult.model");
const Certificate_model_1 = require("../models/Certificate.model");
const Staff_model_1 = require("../models/Staff.model");
const User_model_1 = require("../models/User.model");
const Department_model_1 = require("../models/Department.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, status, departmentId, instructorId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (search)
        where.title = { [sequelize_1.Op.iLike]: `%${search}%` };
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
router.get('/student/exams', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Unauthorized', 401);
    const staffRecord = await Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id'] });
    if (!staffRecord)
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No exams found');
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { staffId: staffRecord.id },
        attributes: ['id', 'courseId', 'status'],
    });
    const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
    if (courseIds.length === 0) {
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No exams found');
    }
    const exams = await Exam_model_1.Exam.findAll({
        where: { courseId: { [sequelize_1.Op.in]: courseIds }, status: { [sequelize_1.Op.in]: ['Published', 'Draft'] } },
        include: [{ model: Course_model_1.Course, as: 'course', attributes: ['id', 'courseCode', 'courseName'] }],
        order: [['createdAt', 'DESC']],
    });
    const examIds = exams.map(e => e.id);
    const results = examIds.length > 0 ? await ExamResult_model_1.ExamResult.findAll({
        where: { examId: { [sequelize_1.Op.in]: examIds } },
        order: [['attemptNumber', 'DESC']],
    }) : [];
    const resultMap = {};
    results.forEach((r) => {
        const key = String(r.examId);
        if (!resultMap[key])
            resultMap[key] = [];
        resultMap[key].push(r);
    });
    const now = new Date();
    const output = exams.map(exam => {
        const myResults = resultMap[String(exam.id)] ?? [];
        const bestResult = myResults.sort((a, b) => b.score - a.score)[0];
        const attemptCount = myResults.length;
        let status;
        if (attemptCount >= exam.attempts) {
            status = bestResult?.score >= exam.passingScore ? 'completed' : 'missed';
        }
        else if (attemptCount > 0) {
            status = 'completed';
        }
        else {
            status = exam.status === 'Published' ? 'available' : 'upcoming';
        }
        return {
            id: Number(exam.id),
            title: exam.examName,
            course: exam.course?.courseName ?? 'Unknown Course',
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
    ResponseFormatter_1.ResponseFormatter.success(res, output, 'Exams retrieved');
}));
router.get('/student/enrollments', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Unauthorized', 401);
    const staff = await Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id'] });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No enrollments found');
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { staffId: staff.id },
        include: [{ model: Course_model_1.Course, as: 'course', attributes: ['id', 'uuid', 'courseCode', 'courseName', 'description', 'duration', 'instructor', 'thumbnail', 'status'] }],
        order: [['enrollmentDate', 'DESC']],
    });
    const result = enrollments.map((e) => ({
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
    ResponseFormatter_1.ResponseFormatter.success(res, result, 'Enrollments retrieved');
}));
router.get('/student/certificates', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Unauthorized', 401);
    const staff = await Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id'] });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No certificates found');
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { staffId: staff.id },
        attributes: ['id'],
    });
    const enrollmentIds = enrollments.map(e => e.id);
    if (enrollmentIds.length === 0)
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No certificates found');
    const certs = await Certificate_model_1.Certificate.findAll({
        where: { enrollmentId: { [sequelize_1.Op.in]: enrollmentIds }, status: 'Issued' },
        include: [{
                model: Enrollment_model_1.Enrollment,
                as: 'enrollment',
                include: [{ model: Course_model_1.Course, as: 'course', attributes: ['courseName', 'instructor'] }],
            }],
        order: [['issuedDate', 'DESC']],
    });
    const result = certs.map((c) => ({
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
    ResponseFormatter_1.ResponseFormatter.success(res, result, 'Certificates retrieved');
}));
router.get('/exams/:examId/leaderboard', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const exam = await Exam_model_1.Exam.findOne({ where: { [sequelize_1.Op.or]: [{ id: examId }, { uuid: examId }] } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const results = await ExamResult_model_1.ExamResult.findAll({
        where: { examId: exam.id, status: { [sequelize_1.Op.in]: ['Passed', 'Failed', 'Submitted'] } },
        include: [{
                model: Enrollment_model_1.Enrollment,
                as: 'enrollment',
                include: [{ model: Staff_model_1.Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName'] }],
            }],
        order: [['score', 'DESC']],
    });
    const ranked = results.map((r, idx) => {
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
        const userId = req.user?.id;
        if (!userId)
            return null;
        const staff = await Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id'] });
        if (!staff)
            return null;
        const enr = await Enrollment_model_1.Enrollment.findOne({ where: { staffId: staff.id, courseId: exam.courseId } });
        return enr ? results.find((r) => String(r.enrollmentId) === String(enr.id)) : null;
    })();
    ResponseFormatter_1.ResponseFormatter.success(res, {
        exam: { id: Number(exam.id), title: exam.examName, date: exam.createdAt, passingScore: exam.passingScore },
        rankings: ranked,
        myResult: myEnrollment ? {
            score: Number(myEnrollment.score),
            status: myEnrollment.status,
            answers: myEnrollment.answers ?? null,
        } : null,
    }, 'Leaderboard retrieved');
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