"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const sequelize_1 = require("sequelize");
const StudentProfile_model_1 = require("../models/StudentProfile.model");
const StudentEnrollment_model_1 = require("../models/StudentEnrollment.model");
const StudentResult_model_1 = require("../models/StudentResult.model");
const StudentAttendance_model_1 = require("../models/StudentAttendance.model");
const ClassSchedule_model_1 = require("../models/ClassSchedule.model");
const Program_model_1 = require("../models/Program.model");
const Department_model_1 = require("../models/Department.model");
const Company_model_1 = require("../models/Company.model");
const User_model_1 = require("../models/User.model");
const Course_model_1 = require("../models/Course.model");
const ErrorHandler_1 = require("../utils/ErrorHandler");
const bcrypt_1 = __importDefault(require("bcrypt"));
const STUDENT_ID_PREFIX_BY_COMPANY_CODE = {
    KURIOS_SAT: 'KST',
    BEADMAX_SCHOOL: 'BM-VS',
};
class StudentService {
    async registerStudent(input) {
        const existing = await User_model_1.User.findOne({ where: { email: input.email } });
        if (existing)
            throw new ErrorHandler_1.ConflictError('Email already registered');
        const passwordHash = await bcrypt_1.default.hash(input.password || 'Student@123', 10);
        const sequelize = User_model_1.User.sequelize;
        const profile = await sequelize.transaction(async (t) => {
            const user = await User_model_1.User.create({
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                phone: input.phone,
                passwordHash,
                status: 'Active',
                emailVerified: false,
                loginAttempts: 0,
            }, { transaction: t });
            const created = await StudentProfile_model_1.StudentProfile.create({
                userId: user.id,
                companyId: input.companyId,
                programId: input.programId,
                departmentId: input.departmentId,
                studentNumber: `BVS-TEMP-${user.id}`,
                gender: input.gender,
                dateOfBirth: input.dateOfBirth,
                address: input.address,
                state: input.state,
                guardianName: input.guardianName,
                guardianPhone: input.guardianPhone,
                guardianEmail: input.guardianEmail,
                guardianRelationship: input.guardianRelationship,
                enrollmentDate: (input.enrollmentDate || new Date().toISOString().slice(0, 10)),
                status: 'Active',
                registeredById: input.registeredById,
            }, { transaction: t });
            const company = await Company_model_1.Company.findByPk(input.companyId, { attributes: ['code'], transaction: t });
            const prefix = STUDENT_ID_PREFIX_BY_COMPANY_CODE[company?.code] || 'BVS';
            const studentNumber = `${prefix}-${new Date().getFullYear()}-${String(created.id).padStart(5, '0')}`;
            await created.update({ studentNumber }, { transaction: t });
            return created;
        });
        return profile;
    }
    async getStudents(filters) {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const offset = (page - 1) * limit;
        const userWhere = {};
        if (filters.search) {
            userWhere[sequelize_1.Op.or] = [
                { firstName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { lastName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { email: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ];
        }
        const profileWhere = {};
        if (filters.companyId)
            profileWhere.companyId = filters.companyId;
        if (filters.programId)
            profileWhere.programId = filters.programId;
        if (filters.status)
            profileWhere.status = filters.status;
        if (filters.departmentId) {
            profileWhere.departmentId = Array.isArray(filters.departmentId)
                ? { [sequelize_1.Op.in]: filters.departmentId }
                : filters.departmentId;
        }
        const { count, rows } = await StudentProfile_model_1.StudentProfile.findAndCountAll({
            where: profileWhere,
            include: [
                { model: User_model_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar'], where: Object.keys(userWhere).length ? userWhere : undefined },
                { model: Program_model_1.Program, as: 'program', attributes: ['id', 'name', 'code', 'level'] },
                { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'] },
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });
        return {
            students: rows,
            pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        };
    }
    async getStudentById(studentId) {
        const student = await StudentProfile_model_1.StudentProfile.findByPk(studentId, {
            include: [
                { model: User_model_1.User, as: 'user', attributes: { exclude: ['passwordHash'] } },
                { model: Program_model_1.Program, as: 'program' },
                { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'] },
            ],
        });
        if (!student)
            throw new ErrorHandler_1.NotFoundError('Student not found');
        return student;
    }
    async getStudentByUserId(userId) {
        const student = await StudentProfile_model_1.StudentProfile.findOne({
            where: { userId },
            include: [
                { model: User_model_1.User, as: 'user', attributes: { exclude: ['passwordHash'] } },
                { model: Program_model_1.Program, as: 'program' },
                { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'] },
            ],
        });
        if (!student)
            throw new ErrorHandler_1.NotFoundError('Student profile not found');
        return student;
    }
    async updateStudent(studentId, data) {
        const student = await StudentProfile_model_1.StudentProfile.findByPk(studentId);
        if (!student)
            throw new ErrorHandler_1.NotFoundError('Student not found');
        const { firstName, lastName, email, phone, ...profileData } = data;
        await student.update(profileData);
        const userUpdates = {};
        if (firstName !== undefined)
            userUpdates.firstName = firstName;
        if (lastName !== undefined)
            userUpdates.lastName = lastName;
        if (email !== undefined)
            userUpdates.email = email;
        if (phone !== undefined)
            userUpdates.phone = phone;
        if (Object.keys(userUpdates).length) {
            await User_model_1.User.update(userUpdates, { where: { id: student.userId } });
        }
        return student;
    }
    async deleteStudent(studentId) {
        const student = await StudentProfile_model_1.StudentProfile.findByPk(studentId);
        if (!student)
            throw new ErrorHandler_1.NotFoundError('Student not found');
        const user = await User_model_1.User.findByPk(student.userId);
        await student.destroy();
        if (user) {
            await user.destroy();
            await user.update({ email: `deleted_${user.email}` });
        }
    }
    async updateStudentStatus(studentId, status, notes) {
        const student = await StudentProfile_model_1.StudentProfile.findByPk(studentId);
        if (!student)
            throw new ErrorHandler_1.NotFoundError('Student not found');
        await student.update({ status, notes });
        if (status === 'Suspended' || status === 'Withdrawn') {
            await User_model_1.User.update({ status: 'Suspended' }, { where: { id: student.userId } });
        }
        else if (status === 'Active') {
            await User_model_1.User.update({ status: 'Active' }, { where: { id: student.userId } });
        }
        return student;
    }
    async enrollStudent(studentId, courseId, enrolledById) {
        const existing = await StudentEnrollment_model_1.StudentEnrollment.findOne({ where: { studentId, courseId } });
        if (existing && existing.status === 'Active') {
            throw new ErrorHandler_1.ConflictError('Student is already enrolled in this course');
        }
        if (existing) {
            await existing.update({ status: 'Active', enrolledAt: new Date() });
            return existing;
        }
        return await StudentEnrollment_model_1.StudentEnrollment.create({
            studentId,
            courseId,
            enrolledById,
            enrolledAt: new Date(),
            status: 'Active',
            progressPercentage: 0,
            isCertificateIssued: false,
        });
    }
    async getStudentEnrollments(studentId) {
        return StudentEnrollment_model_1.StudentEnrollment.findAll({
            where: { studentId },
            include: [{ model: Course_model_1.Course, as: 'course', attributes: ['id', 'title', 'description', 'thumbnail'] }],
            order: [['enrolledAt', 'DESC']],
        });
    }
    async markAttendance(input) {
        const records = input.studentIds.map((studentId) => ({
            studentId,
            courseId: input.courseId,
            classScheduleId: input.classScheduleId,
            date: input.date,
            status: input.statuses[String(studentId)] || 'Absent',
            markedById: input.markedById,
            markedAt: new Date(),
        }));
        const results = await Promise.all(records.map((r) => StudentAttendance_model_1.StudentAttendance.upsert(r)));
        return results;
    }
    async getStudentAttendance(studentId, courseId, dateFrom, dateTo) {
        const where = { studentId };
        if (courseId)
            where.courseId = courseId;
        if (dateFrom && dateTo)
            where.date = { [sequelize_1.Op.between]: [dateFrom, dateTo] };
        const records = await StudentAttendance_model_1.StudentAttendance.findAll({
            where,
            include: [{ model: ClassSchedule_model_1.ClassSchedule, as: 'classSchedule', attributes: ['title', 'dayOfWeek', 'startTime', 'endTime'] }],
            order: [['date', 'DESC']],
        });
        const total = records.length;
        const present = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
        const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;
        return { records, summary: { total, present, attendancePercentage } };
    }
    async recordResult(data) {
        const percentage = Math.round((data.score / data.maxScore) * 100 * 100) / 100;
        const passMark = data.passMark || 50;
        const passed = percentage >= passMark;
        const grade = this.calculateGrade(percentage);
        return StudentResult_model_1.StudentResult.create({
            studentId: data.studentId,
            courseId: data.courseId,
            examId: data.examId,
            assignmentId: data.assignmentId,
            type: data.type,
            title: data.title,
            score: data.score,
            maxScore: data.maxScore,
            percentage,
            grade,
            passed,
            passMark,
            attemptNumber: 1,
            feedback: data.feedback,
            gradedById: data.gradedById,
            gradedAt: new Date(),
            status: 'Graded',
        });
    }
    async getStudentResults(studentId, courseId) {
        const where = { studentId, status: { [sequelize_1.Op.in]: ['Graded', 'Published'] } };
        if (courseId)
            where.courseId = courseId;
        return StudentResult_model_1.StudentResult.findAll({ where, order: [['gradedAt', 'DESC']] });
    }
    async getCourseSchedule(courseId) {
        return ClassSchedule_model_1.ClassSchedule.findAll({
            where: { courseId, isActive: true },
            order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
        });
    }
    async getStudentAnalytics(studentId) {
        const [enrollments, results, attendance] = await Promise.all([
            StudentEnrollment_model_1.StudentEnrollment.findAll({ where: { studentId } }),
            StudentResult_model_1.StudentResult.findAll({ where: { studentId, status: { [sequelize_1.Op.in]: ['Graded', 'Published'] } } }),
            StudentAttendance_model_1.StudentAttendance.findAll({ where: { studentId } }),
        ]);
        const avgScore = results.length
            ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length * 100) / 100
            : 0;
        const attendanceTotal = attendance.length;
        const attendancePresent = attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
        const attendancePct = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;
        const passedExams = results.filter((r) => r.passed && r.type === 'Exam').length;
        const totalExams = results.filter((r) => r.type === 'Exam').length;
        return {
            totalCourses: enrollments.length,
            activeCourses: enrollments.filter((e) => e.status === 'Active').length,
            completedCourses: enrollments.filter((e) => e.status === 'Completed').length,
            avgScore,
            passedExams,
            totalExams,
            passRate: totalExams ? Math.round((passedExams / totalExams) * 100) : 0,
            attendancePct,
            certificatesEarned: enrollments.filter((e) => e.isCertificateIssued).length,
        };
    }
    calculateGrade(percentage) {
        if (percentage >= 90)
            return 'A+';
        if (percentage >= 80)
            return 'A';
        if (percentage >= 75)
            return 'B+';
        if (percentage >= 70)
            return 'B';
        if (percentage >= 65)
            return 'C+';
        if (percentage >= 60)
            return 'C';
        if (percentage >= 50)
            return 'D';
        return 'F';
    }
}
exports.StudentService = StudentService;
exports.default = new StudentService();
//# sourceMappingURL=StudentService.js.map