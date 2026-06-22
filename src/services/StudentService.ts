import { Op } from 'sequelize';
import { StudentProfile, StudentStatus } from '@models/StudentProfile.model';
import { StudentEnrollment, EnrollmentStatus } from '@models/StudentEnrollment.model';
import { StudentResult } from '@models/StudentResult.model';
import { StudentAttendance, AttendanceStatus } from '@models/StudentAttendance.model';
import { ClassSchedule } from '@models/ClassSchedule.model';
import { Program } from '@models/Program.model';
import { Department } from '@models/Department.model';
import { Company } from '@models/Company.model';
import { User } from '@models/User.model';
import { Course } from '@models/Course.model';
import { NotFoundError, ConflictError, ValidationError } from '@utils/ErrorHandler';
import bcrypt from 'bcrypt';

/** Student ID prefix per company — falls back to the generic BVS for any
 * company with no specific scheme requested. */
const STUDENT_ID_PREFIX_BY_COMPANY_CODE: Record<string, string> = {
  KURIOS_SAT: 'KST',
  BEADMAX_SCHOOL: 'BM-VS',
};

interface RegisterStudentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  companyId: bigint;
  programId?: bigint;
  departmentId?: bigint;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  state?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  enrollmentDate?: string;
  registeredById?: bigint;
}

interface AttendanceMarkInput {
  studentIds: bigint[];
  courseId: bigint;
  classScheduleId?: bigint;
  date: string;
  statuses: Record<string, AttendanceStatus>;
  markedById: bigint;
}

export class StudentService {
  /** Register a new student (creates User + StudentProfile) */
  async registerStudent(input: RegisterStudentInput): Promise<StudentProfile> {
    const existing = await User.findOne({ where: { email: input.email } });
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await bcrypt.hash(input.password || 'Student@123', 10);

    // User + StudentProfile used to be two separate creates with nothing
    // tying them together — if StudentProfile.create() failed for any
    // reason (bad FK, enum value, whatever), the User row it had already
    // committed stuck around permanently. A retry with the same email then
    // failed the findOne check above with "Email already registered" even
    // though no student ever actually appeared anywhere — exactly what was
    // reported live. Wrapping both in one transaction means either both
    // commit or neither does.
    const sequelize = User.sequelize!;
    const profile = await sequelize.transaction(async (t) => {
      const user = await User.create({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        status: 'Active',
        emailVerified: false,
        loginAttempts: 0,
      }, { transaction: t });

      // studentNumber used to be generated from a count()-then-create()
      // (count existing students, use count+1) — the same race already
      // found and fixed elsewhere in this codebase for conversation/job/
      // client codes: two registrations landing close together could both
      // compute the same number and the second hits the unique constraint.
      // Generating it from the row's own DB-assigned id is race-free.
      const created = await StudentProfile.create({
        userId: user.id,
        companyId: input.companyId,
        programId: input.programId,
        departmentId: input.departmentId,
        studentNumber: `BVS-TEMP-${user.id}`,
        gender: input.gender as any,
        dateOfBirth: input.dateOfBirth as any,
        address: input.address,
        state: input.state,
        guardianName: input.guardianName,
        guardianPhone: input.guardianPhone,
        guardianEmail: input.guardianEmail,
        guardianRelationship: input.guardianRelationship,
        enrollmentDate: (input.enrollmentDate || new Date().toISOString().slice(0, 10)) as any,
        status: 'Active',
        registeredById: input.registeredById,
      }, { transaction: t });

      const company = await Company.findByPk(input.companyId, { attributes: ['code'], transaction: t });
      const prefix = STUDENT_ID_PREFIX_BY_COMPANY_CODE[(company as any)?.code] || 'BVS';
      const studentNumber = `${prefix}-${new Date().getFullYear()}-${String(created.id).padStart(5, '0')}`;
      await created.update({ studentNumber }, { transaction: t });

      return created;
    });

    return profile;
  }

  /** Get paginated student list with optional filters */
  async getStudents(filters: {
    companyId?: bigint;
    programId?: bigint;
    departmentId?: bigint | bigint[];
    status?: StudentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    const userWhere: Record<string, unknown> = {};
    if (filters.search) {
      userWhere[Op.or as any] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const profileWhere: Record<string, unknown> = {};
    if (filters.companyId) profileWhere.companyId = filters.companyId;
    if (filters.programId) profileWhere.programId = filters.programId;
    if (filters.status) profileWhere.status = filters.status;
    if (filters.departmentId) {
      profileWhere.departmentId = Array.isArray(filters.departmentId)
        ? { [Op.in]: filters.departmentId }
        : filters.departmentId;
    }

    const { count, rows } = await StudentProfile.findAndCountAll({
      where: profileWhere,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar'], where: Object.keys(userWhere).length ? userWhere : undefined },
        { model: Program, as: 'program', attributes: ['id', 'name', 'code', 'level'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
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

  /** Get a single student with full details */
  async getStudentById(studentId: bigint) {
    const student = await StudentProfile.findByPk(studentId, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['passwordHash'] } },
        { model: Program, as: 'program' },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
    });
    if (!student) throw new NotFoundError('Student not found');
    return student;
  }

  /** Get student by userId (for student portal self-access) */
  async getStudentByUserId(userId: bigint) {
    const student = await StudentProfile.findOne({
      where: { userId },
      include: [
        { model: User, as: 'user', attributes: { exclude: ['passwordHash'] } },
        { model: Program, as: 'program' },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
    });
    if (!student) throw new NotFoundError('Student profile not found');
    return student;
  }

  /** Update student profile. firstName/lastName/email/phone live on the
   * linked User row, not StudentProfile — pulled out and synced there
   * separately instead of being silently dropped by student.update(). */
  async updateStudent(studentId: bigint, data: Partial<StudentProfile> & { firstName?: string; lastName?: string; email?: string; phone?: string }) {
    const student = await StudentProfile.findByPk(studentId);
    if (!student) throw new NotFoundError('Student not found');

    const { firstName, lastName, email, phone, ...profileData } = data as any;
    await student.update(profileData);

    const userUpdates: Record<string, unknown> = {};
    if (firstName !== undefined) userUpdates.firstName = firstName;
    if (lastName !== undefined) userUpdates.lastName = lastName;
    if (email !== undefined) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;
    if (Object.keys(userUpdates).length) {
      await User.update(userUpdates, { where: { id: student.userId } });
    }

    return student;
  }

  /** Remove a student. StudentProfile itself isn't paranoid (no deletedAt
   * column), so this is a real delete of that row; the linked User is
   * soft-deleted and its email freed up for reuse the same way the demo
   * account cleanup had to learn to do — Postgres's unique index on email
   * doesn't care that a row is "soft-deleted". */
  async deleteStudent(studentId: bigint) {
    const student = await StudentProfile.findByPk(studentId);
    if (!student) throw new NotFoundError('Student not found');
    const user = await User.findByPk(student.userId);
    await student.destroy();
    if (user) {
      await user.destroy();
      await user.update({ email: `deleted_${user.email}` } as any);
    }
  }

  /** Suspend or activate student */
  async updateStudentStatus(studentId: bigint, status: StudentStatus, notes?: string) {
    const student = await StudentProfile.findByPk(studentId);
    if (!student) throw new NotFoundError('Student not found');
    await student.update({ status, notes });

    // Suspend User account too when student is suspended
    if (status === 'Suspended' || status === 'Withdrawn') {
      await User.update({ status: 'Suspended' }, { where: { id: student.userId } });
    } else if (status === 'Active') {
      await User.update({ status: 'Active' }, { where: { id: student.userId } });
    }

    return student;
  }

  /** Enroll student in a course */
  async enrollStudent(studentId: bigint, courseId: bigint, enrolledById?: bigint) {
    const existing = await StudentEnrollment.findOne({ where: { studentId, courseId } });
    if (existing && existing.status === 'Active') {
      throw new ConflictError('Student is already enrolled in this course');
    }
    if (existing) {
      await existing.update({ status: 'Active', enrolledAt: new Date() });
      return existing;
    }
    return await StudentEnrollment.create({
      studentId,
      courseId,
      enrolledById,
      enrolledAt: new Date(),
      status: 'Active',
      progressPercentage: 0,
      isCertificateIssued: false,
    });
  }

  /** Get all enrollments for a student */
  async getStudentEnrollments(studentId: bigint) {
    return StudentEnrollment.findAll({
      where: { studentId },
      include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'description', 'thumbnail'] }],
      order: [['enrolledAt', 'DESC']],
    });
  }

  /** Mark class attendance for multiple students */
  async markAttendance(input: AttendanceMarkInput) {
    const records = input.studentIds.map((studentId) => ({
      studentId,
      courseId: input.courseId,
      classScheduleId: input.classScheduleId,
      date: input.date,
      status: input.statuses[String(studentId)] || 'Absent' as AttendanceStatus,
      markedById: input.markedById,
      markedAt: new Date(),
    }));

    // Upsert — update existing record or create new
    const results = await Promise.all(
      records.map((r) =>
        StudentAttendance.upsert(r as any)
      )
    );
    return results;
  }

  /** Get attendance for a student in a course */
  async getStudentAttendance(studentId: bigint, courseId?: bigint, dateFrom?: string, dateTo?: string) {
    const where: Record<string, unknown> = { studentId };
    if (courseId) where.courseId = courseId;
    if (dateFrom && dateTo) where.date = { [Op.between]: [dateFrom, dateTo] };

    const records = await StudentAttendance.findAll({
      where,
      include: [{ model: ClassSchedule, as: 'classSchedule', attributes: ['title', 'dayOfWeek', 'startTime', 'endTime'] }],
      order: [['date', 'DESC']],
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { records, summary: { total, present, attendancePercentage } };
  }

  /** Record / update a student result */
  async recordResult(data: {
    studentId: bigint;
    courseId?: bigint;
    examId?: bigint;
    assignmentId?: bigint;
    type: string;
    title: string;
    score: number;
    maxScore: number;
    passMark?: number;
    feedback?: string;
    gradedById?: bigint;
  }) {
    const percentage = Math.round((data.score / data.maxScore) * 100 * 100) / 100;
    const passMark = data.passMark || 50;
    const passed = percentage >= passMark;
    const grade = this.calculateGrade(percentage);

    return StudentResult.create({
      studentId: data.studentId,
      courseId: data.courseId,
      examId: data.examId,
      assignmentId: data.assignmentId,
      type: data.type as any,
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

  /** Get student results */
  async getStudentResults(studentId: bigint, courseId?: bigint) {
    const where: Record<string, unknown> = { studentId, status: { [Op.in]: ['Graded', 'Published'] } };
    if (courseId) where.courseId = courseId;
    return StudentResult.findAll({ where, order: [['gradedAt', 'DESC']] });
  }

  /** Get class schedules for a course */
  async getCourseSchedule(courseId: bigint) {
    return ClassSchedule.findAll({
      where: { courseId, isActive: true },
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
    });
  }

  /** Student performance analytics */
  async getStudentAnalytics(studentId: bigint) {
    const [enrollments, results, attendance] = await Promise.all([
      StudentEnrollment.findAll({ where: { studentId } }),
      StudentResult.findAll({ where: { studentId, status: { [Op.in]: ['Graded', 'Published'] } } }),
      StudentAttendance.findAll({ where: { studentId } }),
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

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }
}

export default new StudentService();
