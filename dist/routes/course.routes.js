"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
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
const StudentProfile_model_1 = require("../models/StudentProfile.model");
const User_model_1 = require("../models/User.model");
const Department_model_1 = require("../models/Department.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
function getDeptScope(req, allPermission) {
    const user = req.user;
    const normRoles = (user.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    if (normRoles.includes('superadmin') || normRoles.includes('admin') || normRoles.includes('headofadmin')) {
        return { scoped: false, departmentId: null };
    }
    const perms = new Set((user.permissions || []).map((p) => p.toLowerCase()));
    if (perms.has(allPermission.toLowerCase())) {
        return { scoped: false, departmentId: null };
    }
    return { scoped: true, departmentId: user.departmentId ?? null };
}
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
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
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
router.post('/', AuthMiddleware_1.default.requirePermission('LMS.COURSE.CREATE.ALL', 'LMS.COURSE.CREATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { title, courseCode, description, instructorId, instructorName, duration, fee, startDate, endDate, status, certificateRequired, passingScore, maxParticipants, minParticipants } = req.body;
    if (!title || !courseCode || !instructorName || !duration || !startDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title, courseCode, instructorName, duration, startDate are required', 400);
    }
    const scope = getDeptScope(req, 'lms.course.create.all');
    let { departmentId } = req.body;
    if (scope.scoped) {
        if (!scope.departmentId)
            return ResponseFormatter_1.ResponseFormatter.error(res, 'No department assigned to your account', 403);
        departmentId = scope.departmentId;
    }
    const existing = await Course_model_1.Course.findOne({ where: { courseCode } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course code already exists', 409);
    const course = await Course_model_1.Course.create({
        uuid: (0, uuid_1.v4)(), title, courseCode, description, departmentId, instructorId: instructorId || undefined, instructorName,
        duration, fee, startDate, endDate, status: status || 'Draft',
        certificateRequired: certificateRequired ?? false,
        passingScore, maxParticipants, minParticipants,
        createdById: req.user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, course, 'Course created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('LMS.COURSE.UPDATE.ALL', 'LMS.COURSE.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const scope = getDeptScope(req, 'lms.course.update.all');
    if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
    }
    const allowed = ['title', 'description', 'departmentId', 'instructorId', 'instructorName', 'duration', 'fee',
        'startDate', 'endDate', 'status', 'certificateRequired', 'passingScore', 'maxParticipants', 'minParticipants'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    if (scope.scoped)
        delete updates.departmentId;
    await course.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, course, 'Course updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('LMS.COURSE.DELETE.ALL', 'LMS.COURSE.DELETE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const scope = getDeptScope(req, 'lms.course.delete.all');
    if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
    }
    await course.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Course deleted');
}));
router.get('/:id/modules', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const modules = await CourseModule_model_1.CourseModule.findAll({
        where: { courseId: course.id },
        include: [{ model: CourseContent_model_1.CourseContent, as: 'contents', order: [['sequence', 'ASC']] }],
        order: [['sequence', 'ASC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, modules);
}));
router.post('/:id/modules', AuthMiddleware_1.default.requirePermission('LMS.COURSE.UPDATE.ALL', 'LMS.COURSE.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const scope = getDeptScope(req, 'lms.course.update.all');
    if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
    }
    const { title, description, sequence, duration } = req.body;
    if (!title)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title is required', 400);
    const moduleCount = await CourseModule_model_1.CourseModule.count({ where: { courseId: course.id } });
    const mod = await CourseModule_model_1.CourseModule.create({
        uuid: (0, uuid_1.v4)(), courseId: course.id,
        moduleCode: `${course.courseCode}-M${moduleCount + 1}`, moduleName: title, description,
        sequence: sequence || moduleCount + 1, duration: duration || 0, status: 'Draft',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, mod, 'Module created', 201);
}));
router.put('/:courseId/modules/:moduleId', AuthMiddleware_1.default.requirePermission('LMS.COURSE.UPDATE.ALL', 'LMS.COURSE.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const mod = await CourseModule_model_1.CourseModule.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.moduleId) },
    });
    if (!mod)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Module not found', 404);
    const scope = getDeptScope(req, 'lms.course.update.all');
    if (scope.scoped) {
        const course = await Course_model_1.Course.findByPk(mod.courseId);
        if (!course || String(course.departmentId) !== String(scope.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
        }
    }
    await mod.update(req.body);
    ResponseFormatter_1.ResponseFormatter.success(res, mod, 'Module updated');
}));
router.delete('/:courseId/modules/:moduleId', AuthMiddleware_1.default.requirePermission('LMS.COURSE.UPDATE.ALL', 'LMS.COURSE.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const mod = await CourseModule_model_1.CourseModule.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.moduleId) },
    });
    if (!mod)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Module not found', 404);
    const scope = getDeptScope(req, 'lms.course.update.all');
    if (scope.scoped) {
        const course = await Course_model_1.Course.findByPk(mod.courseId);
        if (!course || String(course.departmentId) !== String(scope.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage courses in your own department', 403);
        }
    }
    await mod.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Module deleted');
}));
router.get('/student/exams', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Unauthorized', 401);
    const studentRecord = await StudentProfile_model_1.StudentProfile.findOne({ where: { userId }, attributes: ['id'] });
    if (!studentRecord)
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No exams found');
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { studentId: studentRecord.id },
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
    const student = await StudentProfile_model_1.StudentProfile.findOne({ where: { userId }, attributes: ['id'] });
    if (!student)
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No enrollments found');
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { studentId: student.id },
        include: [{ model: Course_model_1.Course, as: 'course', attributes: ['id', 'uuid', 'courseCode', 'title', 'description', 'duration', 'instructorName', 'status'] }],
        order: [['enrollmentDate', 'DESC']],
    });
    const result = enrollments.map((e) => ({
        id: Number(e.id),
        courseId: Number(e.courseId),
        title: e.course?.title ?? 'Unknown Course',
        instructor: e.course?.instructorName ?? '',
        progress: Number(e.progressPercentage) ?? 0,
        totalLessons: 0,
        doneLessons: 0,
        enrolledDate: e.enrollmentDate?.toISOString?.()?.slice(0, 10) ?? '',
        completedDate: e.completionDate?.toISOString?.()?.slice(0, 10) ?? null,
        status: e.status,
        thumbnail: null,
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, result, 'Enrollments retrieved');
}));
router.get('/student/certificates', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Unauthorized', 401);
    const student = await StudentProfile_model_1.StudentProfile.findOne({ where: { userId }, attributes: ['id'] });
    if (!student)
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No certificates found');
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { studentId: student.id },
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
                include: [{ model: Course_model_1.Course, as: 'course', attributes: ['title', 'instructorName'] }],
            }],
        order: [['issuedDate', 'DESC']],
    });
    const result = certs.map((c) => ({
        id: Number(c.id),
        credentialId: c.certificateCode,
        title: c.certificateName || 'Certificate of Completion',
        course: c.enrollment?.course?.title ?? 'Unknown Course',
        instructor: c.enrollment?.course?.instructorName ?? '',
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
                include: [
                    { model: Staff_model_1.Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName'] },
                    { model: StudentProfile_model_1.StudentProfile, as: 'student', include: [{ model: User_model_1.User, as: 'user', attributes: ['firstName', 'lastName'] }] },
                ],
            }],
        order: [['score', 'DESC']],
    });
    const ranked = results.map((r, idx) => {
        const staff = r.enrollment?.staff;
        const studentUser = r.enrollment?.student?.user;
        const name = studentUser
            ? `${studentUser.firstName ?? ''} ${studentUser.lastName ?? ''}`.trim()
            : staff ? `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim() : `Student #${r.enrollmentId}`;
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
        const student = await StudentProfile_model_1.StudentProfile.findOne({ where: { userId }, attributes: ['id'] });
        const enr = student
            ? await Enrollment_model_1.Enrollment.findOne({ where: { studentId: student.id, courseId: exam.courseId } })
            : null;
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
    const course = await Course_model_1.Course.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const exams = await Exam_model_1.Exam.findAll({ where: { courseId: course.id }, include: [{ model: Question_model_1.Question, as: 'questions' }] });
    ResponseFormatter_1.ResponseFormatter.success(res, exams);
}));
router.post('/:id/exams', AuthMiddleware_1.default.requirePermission('LMS.EXAM.CREATE.ALL', 'LMS.EXAM.CREATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const scope = getDeptScope(req, 'lms.exam.create.all');
    if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage exams for courses in your own department', 403);
    }
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
router.put('/:courseId/exams/:examId', AuthMiddleware_1.default.requirePermission('LMS.EXAM.UPDATE.ALL', 'LMS.EXAM.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const exam = await Exam_model_1.Exam.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.examId) } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const scope = getDeptScope(req, 'lms.exam.update.all');
    if (scope.scoped) {
        const course = await Course_model_1.Course.findByPk(exam.courseId);
        if (!course || String(course.departmentId) !== String(scope.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage exams for courses in your own department', 403);
        }
    }
    await exam.update(req.body);
    ResponseFormatter_1.ResponseFormatter.success(res, exam, 'Exam updated');
}));
router.post('/:courseId/exams/:examId/questions', AuthMiddleware_1.default.requirePermission('LMS.EXAM.UPDATE.ALL', 'LMS.EXAM.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const exam = await Exam_model_1.Exam.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.examId) } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const scope = getDeptScope(req, 'lms.exam.update.all');
    if (scope.scoped) {
        const course = await Course_model_1.Course.findByPk(exam.courseId);
        if (!course || String(course.departmentId) !== String(scope.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage exams for courses in your own department', 403);
        }
    }
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
    const exam = await Exam_model_1.Exam.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.examId) } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const questions = await Question_model_1.Question.findAll({ where: { examId: exam.id, status: 'Active' }, order: [['sequence', 'ASC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, questions);
}));
router.delete('/:courseId/exams/:examId/questions/:questionId', AuthMiddleware_1.default.requirePermission('LMS.EXAM.UPDATE.ALL', 'LMS.EXAM.UPDATE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const exam = await Exam_model_1.Exam.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.examId) } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const scope = getDeptScope(req, 'lms.exam.update.all');
    if (scope.scoped) {
        const course = await Course_model_1.Course.findByPk(exam.courseId);
        if (!course || String(course.departmentId) !== String(scope.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage exams for courses in your own department', 403);
        }
    }
    const question = await Question_model_1.Question.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.questionId), examId: exam.id } });
    if (!question)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Question not found', 404);
    await question.update({ status: 'Archived' });
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Question removed');
}));
router.get('/:id/enrollments', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const enrollments = await Enrollment_model_1.Enrollment.findAll({
        where: { courseId: course.id },
        include: [
            { model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email', 'avatar'] }] },
            { model: StudentProfile_model_1.StudentProfile, as: 'student', include: [{ model: User_model_1.User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'avatar'] }] },
        ],
        order: [['enrollmentDate', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, enrollments);
}));
router.get('/:id/certificates', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const course = await Course_model_1.Course.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const enrollments = await Enrollment_model_1.Enrollment.findAll({ where: { courseId: course.id }, attributes: ['id'] });
    const enrollmentIds = enrollments.map(e => e.id);
    if (enrollmentIds.length === 0)
        return ResponseFormatter_1.ResponseFormatter.success(res, []);
    const certs = await Certificate_model_1.Certificate.findAll({
        where: { enrollmentId: { [sequelize_1.Op.in]: enrollmentIds } },
        include: [{
                model: Enrollment_model_1.Enrollment, as: 'enrollment',
                include: [
                    { model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName', 'email'] }] },
                    { model: StudentProfile_model_1.StudentProfile, as: 'student', include: [{ model: User_model_1.User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
                ],
            }],
        order: [['issuedDate', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, certs);
}));
router.post('/enrollments/:enrollmentId/certificate', AuthMiddleware_1.default.requirePermission('LMS.CERTIFICATE.ISSUE.ALL', 'LMS.CERTIFICATE.ISSUE.OWN_DEPARTMENT'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const enrollment = await Enrollment_model_1.Enrollment.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.enrollmentId) } });
    if (!enrollment)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Enrollment not found', 404);
    const course = await Course_model_1.Course.findByPk(enrollment.courseId);
    if (!course)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Course not found', 404);
    const scope = getDeptScope(req, 'lms.certificate.issue.all');
    if (scope.scoped && String(course.departmentId) !== String(scope.departmentId)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only issue certificates for courses in your own department', 403);
    }
    if (enrollment.status !== 'Completed') {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Enrollment must be Completed before a certificate can be issued', 400);
    }
    const existing = await Certificate_model_1.Certificate.findOne({ where: { enrollmentId: enrollment.id, status: 'Issued' } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'A certificate has already been issued for this enrollment', 409);
    const { certificateName } = req.body;
    const code = `CERT-${course.courseCode}-${Date.now().toString(36).toUpperCase()}`;
    const certificate = await Certificate_model_1.Certificate.create({
        uuid: (0, uuid_1.v4)(), enrollmentId: enrollment.id,
        certificateCode: code, certificateName: certificateName || `Certificate of Completion — ${course.title}`,
        issuedDate: new Date(), verificationCode: (0, uuid_1.v4)().slice(0, 8).toUpperCase(),
        status: 'Issued',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, certificate, 'Certificate issued', 201);
}));
router.get('/:courseId/exams/:examId/results', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const exam = await Exam_model_1.Exam.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.examId) } });
    if (!exam)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Exam not found', 404);
    const results = await ExamResult_model_1.ExamResult.findAll({
        where: { examId: exam.id },
        include: [{
                model: Enrollment_model_1.Enrollment, as: 'enrollment',
                include: [
                    { model: Staff_model_1.Staff, as: 'staff', include: [{ model: User_model_1.User, attributes: ['firstName', 'lastName'] }] },
                    { model: StudentProfile_model_1.StudentProfile, as: 'student', include: [{ model: User_model_1.User, as: 'user', attributes: ['firstName', 'lastName'] }] },
                ],
            }],
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