"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const StudentService_1 = __importDefault(require("@services/StudentService"));
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
class StudentController {
    static async register(req, res, next) {
        try {
            const student = await StudentService_1.default.registerStudent({
                ...req.body,
                companyId: BigInt(req.body.companyId || 1),
                registeredById: BigInt(req.user.id),
            });
            ResponseFormatter_1.ResponseFormatter.success(res, student, 'Student registered successfully', 201);
        }
        catch (e) {
            next(e);
        }
    }
    static async list(req, res, next) {
        try {
            const { companyId, programId, status, search, page, limit } = req.query;
            const result = await StudentService_1.default.getStudents({
                companyId: companyId ? BigInt(companyId) : undefined,
                programId: programId ? BigInt(programId) : undefined,
                status: status,
                search,
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
            });
            ResponseFormatter_1.ResponseFormatter.success(res, result, 'Students retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async getById(req, res, next) {
        try {
            const student = await StudentService_1.default.getStudentById(BigInt(req.params.id));
            ResponseFormatter_1.ResponseFormatter.success(res, student, 'Student retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async update(req, res, next) {
        try {
            const student = await StudentService_1.default.updateStudent(BigInt(req.params.id), req.body);
            ResponseFormatter_1.ResponseFormatter.success(res, student, 'Student updated');
        }
        catch (e) {
            next(e);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const { status, notes } = req.body;
            const student = await StudentService_1.default.updateStudentStatus(BigInt(req.params.id), status, notes);
            ResponseFormatter_1.ResponseFormatter.success(res, student, `Student status updated to ${status}`);
        }
        catch (e) {
            next(e);
        }
    }
    static async enroll(req, res, next) {
        try {
            const { courseId } = req.body;
            const enrollment = await StudentService_1.default.enrollStudent(BigInt(req.params.id), BigInt(courseId), BigInt(req.user.id));
            ResponseFormatter_1.ResponseFormatter.success(res, enrollment, 'Student enrolled', 201);
        }
        catch (e) {
            next(e);
        }
    }
    static async getEnrollments(req, res, next) {
        try {
            const enrollments = await StudentService_1.default.getStudentEnrollments(BigInt(req.params.id));
            ResponseFormatter_1.ResponseFormatter.success(res, enrollments, 'Enrollments retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async markAttendance(req, res, next) {
        try {
            const { studentIds, courseId, classScheduleId, date, statuses } = req.body;
            const result = await StudentService_1.default.markAttendance({
                studentIds: studentIds.map(BigInt),
                courseId: BigInt(courseId),
                classScheduleId: classScheduleId ? BigInt(classScheduleId) : undefined,
                date,
                statuses,
                markedById: BigInt(req.user.id),
            });
            ResponseFormatter_1.ResponseFormatter.success(res, result, 'Attendance marked');
        }
        catch (e) {
            next(e);
        }
    }
    static async getAttendance(req, res, next) {
        try {
            const { courseId, dateFrom, dateTo } = req.query;
            const result = await StudentService_1.default.getStudentAttendance(BigInt(req.params.id), courseId ? BigInt(courseId) : undefined, dateFrom, dateTo);
            ResponseFormatter_1.ResponseFormatter.success(res, result, 'Attendance retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async recordResult(req, res, next) {
        try {
            const result = await StudentService_1.default.recordResult({
                ...req.body,
                studentId: BigInt(req.params.id),
                gradedById: BigInt(req.user.id),
            });
            ResponseFormatter_1.ResponseFormatter.success(res, result, 'Result recorded', 201);
        }
        catch (e) {
            next(e);
        }
    }
    static async getResults(req, res, next) {
        try {
            const { courseId } = req.query;
            const results = await StudentService_1.default.getStudentResults(BigInt(req.params.id), courseId ? BigInt(courseId) : undefined);
            ResponseFormatter_1.ResponseFormatter.success(res, results, 'Results retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async getAnalytics(req, res, next) {
        try {
            const analytics = await StudentService_1.default.getStudentAnalytics(BigInt(req.params.id));
            ResponseFormatter_1.ResponseFormatter.success(res, analytics, 'Analytics retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async getMyProfile(req, res, next) {
        try {
            const profile = await StudentService_1.default.getStudentByUserId(BigInt(req.user.id));
            ResponseFormatter_1.ResponseFormatter.success(res, profile, 'Profile retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async updateMyProfile(req, res, next) {
        try {
            const profile = await StudentService_1.default.getStudentByUserId(BigInt(req.user.id));
            const allowed = ['gender', 'dateOfBirth', 'address', 'state', 'bio', 'emergencyContact', 'emergencyPhone'];
            const safeData = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
            const updated = await StudentService_1.default.updateStudent(profile.id, safeData);
            ResponseFormatter_1.ResponseFormatter.success(res, updated, 'Profile updated');
        }
        catch (e) {
            next(e);
        }
    }
    static async getMyEnrollments(req, res, next) {
        try {
            const profile = await StudentService_1.default.getStudentByUserId(BigInt(req.user.id));
            const enrollments = await StudentService_1.default.getStudentEnrollments(profile.id);
            ResponseFormatter_1.ResponseFormatter.success(res, enrollments, 'Enrollments retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async getMyAttendance(req, res, next) {
        try {
            const profile = await StudentService_1.default.getStudentByUserId(BigInt(req.user.id));
            const { courseId, dateFrom, dateTo } = req.query;
            const result = await StudentService_1.default.getStudentAttendance(profile.id, courseId ? BigInt(courseId) : undefined, dateFrom, dateTo);
            ResponseFormatter_1.ResponseFormatter.success(res, result, 'Attendance retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async getMyResults(req, res, next) {
        try {
            const profile = await StudentService_1.default.getStudentByUserId(BigInt(req.user.id));
            const { courseId } = req.query;
            const results = await StudentService_1.default.getStudentResults(profile.id, courseId ? BigInt(courseId) : undefined);
            ResponseFormatter_1.ResponseFormatter.success(res, results, 'Results retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async getMyAnalytics(req, res, next) {
        try {
            const profile = await StudentService_1.default.getStudentByUserId(BigInt(req.user.id));
            const analytics = await StudentService_1.default.getStudentAnalytics(profile.id);
            ResponseFormatter_1.ResponseFormatter.success(res, analytics, 'Analytics retrieved');
        }
        catch (e) {
            next(e);
        }
    }
    static async getMySchedule(req, res, next) {
        try {
            const profile = await StudentService_1.default.getStudentByUserId(BigInt(req.user.id));
            const enrollments = await StudentService_1.default.getStudentEnrollments(profile.id);
            const courseIds = enrollments.filter((e) => e.status === 'Active').map((e) => e.courseId);
            const schedules = await Promise.all(courseIds.map((id) => StudentService_1.default.getCourseSchedule(id)));
            ResponseFormatter_1.ResponseFormatter.success(res, schedules.flat(), 'Schedule retrieved');
        }
        catch (e) {
            next(e);
        }
    }
}
exports.StudentController = StudentController;
exports.default = StudentController;
//# sourceMappingURL=StudentController.js.map