import { Request, Response, NextFunction } from 'express';
import StudentService from '@services/StudentService';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ForbiddenError } from '@utils/ErrorHandler';
import { getMultiDeptScope } from '@utils/departmentScope';

export class StudentController {
  // ─── ADMIN: Student Registration ──────────────────────────────
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const scope = await getMultiDeptScope(req, 'stm.student.create.all');
      let departmentId = req.body.departmentId ? BigInt(req.body.departmentId) : undefined;
      if (scope.scoped) {
        if (scope.departmentIds.length === 0) throw new ForbiddenError('No department assigned to your account');
        if (!departmentId || !scope.departmentIds.includes(Number(departmentId))) {
          departmentId = BigInt(scope.departmentIds[0]);
        }
      }

      const student = await StudentService.registerStudent({
        ...req.body,
        companyId: BigInt(req.body.companyId || 1),
        departmentId,
        registeredById: BigInt(req.user!.id),
      });
      ResponseFormatter.success(res, student, 'Student registered successfully', 201);
    } catch (e) { next(e); }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId, programId, departmentId, status, search, page, limit } = req.query as Record<string, string>;

      const scope = await getMultiDeptScope(req, 'stm.student.read.all');
      let departmentFilter: bigint | bigint[] | undefined = departmentId ? BigInt(departmentId) : undefined;
      if (scope.scoped) {
        departmentFilter = scope.departmentIds.map(id => BigInt(id));
      }

      const result = await StudentService.getStudents({
        companyId: companyId ? BigInt(companyId) : undefined,
        programId: programId ? BigInt(programId) : undefined,
        departmentId: departmentFilter,
        status: status as any,
        search,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      ResponseFormatter.success(res, result, 'Students retrieved');
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.getStudentById(BigInt(req.params.id));

      const scope = await getMultiDeptScope(req, 'stm.student.read.all');
      if (scope.scoped && (!student.departmentId || !scope.departmentIds.includes(Number(student.departmentId)))) {
        throw new ForbiddenError('You can only view students in your own departments');
      }

      ResponseFormatter.success(res, student, 'Student retrieved');
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await StudentService.getStudentById(BigInt(req.params.id));
      const scope = await getMultiDeptScope(req, 'stm.student.update.all');
      if (scope.scoped && (!existing.departmentId || !scope.departmentIds.includes(Number(existing.departmentId)))) {
        throw new ForbiddenError('You can only manage students in your own departments');
      }

      const student = await StudentService.updateStudent(BigInt(req.params.id), req.body);
      ResponseFormatter.success(res, student, 'Student updated');
    } catch (e) { next(e); }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await StudentService.getStudentById(BigInt(req.params.id));
      const scope = await getMultiDeptScope(req, 'stm.student.update.all');
      if (scope.scoped && (!existing.departmentId || !scope.departmentIds.includes(Number(existing.departmentId)))) {
        throw new ForbiddenError('You can only manage students in your own departments');
      }

      const { status, notes } = req.body;
      const student = await StudentService.updateStudentStatus(BigInt(req.params.id), status, notes);
      ResponseFormatter.success(res, student, `Student status updated to ${status}`);
    } catch (e) { next(e); }
  }

  // ─── Enrollment ───────────────────────────────────────────────
  static async enroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.body;
      const enrollment = await StudentService.enrollStudent(
        BigInt(req.params.id),
        BigInt(courseId),
        BigInt(req.user!.id)
      );
      ResponseFormatter.success(res, enrollment, 'Student enrolled', 201);
    } catch (e) { next(e); }
  }

  static async getEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const enrollments = await StudentService.getStudentEnrollments(BigInt(req.params.id));
      ResponseFormatter.success(res, enrollments, 'Enrollments retrieved');
    } catch (e) { next(e); }
  }

  // ─── Attendance ───────────────────────────────────────────────
  static async markAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentIds, courseId, classScheduleId, date, statuses } = req.body;
      const result = await StudentService.markAttendance({
        studentIds: studentIds.map(BigInt),
        courseId: BigInt(courseId),
        classScheduleId: classScheduleId ? BigInt(classScheduleId) : undefined,
        date,
        statuses,
        markedById: BigInt(req.user!.id),
      });
      ResponseFormatter.success(res, result, 'Attendance marked');
    } catch (e) { next(e); }
  }

  static async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, dateFrom, dateTo } = req.query as Record<string, string>;
      const result = await StudentService.getStudentAttendance(
        BigInt(req.params.id),
        courseId ? BigInt(courseId) : undefined,
        dateFrom,
        dateTo
      );
      ResponseFormatter.success(res, result, 'Attendance retrieved');
    } catch (e) { next(e); }
  }

  // ─── Results ──────────────────────────────────────────────────
  static async recordResult(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StudentService.recordResult({
        ...req.body,
        studentId: BigInt(req.params.id),
        gradedById: BigInt(req.user!.id),
      });
      ResponseFormatter.success(res, result, 'Result recorded', 201);
    } catch (e) { next(e); }
  }

  static async getResults(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.query as Record<string, string>;
      const results = await StudentService.getStudentResults(
        BigInt(req.params.id),
        courseId ? BigInt(courseId) : undefined
      );
      ResponseFormatter.success(res, results, 'Results retrieved');
    } catch (e) { next(e); }
  }

  // ─── Analytics ────────────────────────────────────────────────
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await StudentService.getStudentAnalytics(BigInt(req.params.id));
      ResponseFormatter.success(res, analytics, 'Analytics retrieved');
    } catch (e) { next(e); }
  }

  // ─── STUDENT SELF: Portal endpoints ───────────────────────────
  static async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await StudentService.getStudentByUserId(BigInt(req.user!.id));
      ResponseFormatter.success(res, profile, 'Profile retrieved');
    } catch (e) { next(e); }
  }

  static async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await StudentService.getStudentByUserId(BigInt(req.user!.id));
      const allowed = ['gender', 'dateOfBirth', 'address', 'state', 'bio', 'emergencyContact', 'emergencyPhone'];
      const safeData = Object.fromEntries(
        Object.entries(req.body).filter(([k]) => allowed.includes(k))
      );
      const updated = await StudentService.updateStudent(profile.id, safeData as any);
      ResponseFormatter.success(res, updated, 'Profile updated');
    } catch (e) { next(e); }
  }

  static async getMyEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await StudentService.getStudentByUserId(BigInt(req.user!.id));
      const enrollments = await StudentService.getStudentEnrollments(profile.id);
      ResponseFormatter.success(res, enrollments, 'Enrollments retrieved');
    } catch (e) { next(e); }
  }

  static async getMyAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await StudentService.getStudentByUserId(BigInt(req.user!.id));
      const { courseId, dateFrom, dateTo } = req.query as Record<string, string>;
      const result = await StudentService.getStudentAttendance(
        profile.id,
        courseId ? BigInt(courseId) : undefined,
        dateFrom,
        dateTo
      );
      ResponseFormatter.success(res, result, 'Attendance retrieved');
    } catch (e) { next(e); }
  }

  static async getMyResults(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await StudentService.getStudentByUserId(BigInt(req.user!.id));
      const { courseId } = req.query as Record<string, string>;
      const results = await StudentService.getStudentResults(
        profile.id,
        courseId ? BigInt(courseId) : undefined
      );
      ResponseFormatter.success(res, results, 'Results retrieved');
    } catch (e) { next(e); }
  }

  static async getMyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await StudentService.getStudentByUserId(BigInt(req.user!.id));
      const analytics = await StudentService.getStudentAnalytics(profile.id);
      ResponseFormatter.success(res, analytics, 'Analytics retrieved');
    } catch (e) { next(e); }
  }

  static async getMySchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await StudentService.getStudentByUserId(BigInt(req.user!.id));
      const enrollments = await StudentService.getStudentEnrollments(profile.id);
      const courseIds = enrollments.filter((e) => e.status === 'Active').map((e) => e.courseId);
      const schedules = await Promise.all(courseIds.map((id) => StudentService.getCourseSchedule(id)));
      ResponseFormatter.success(res, schedules.flat(), 'Schedule retrieved');
    } catch (e) { next(e); }
  }
}

export default StudentController;
