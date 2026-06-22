import { Router } from 'express';
import AuthMiddleware from '../middleware/AuthMiddleware';
import StudentController from '../controllers/StudentController';
import { PermissionCode } from '../config/PermissionCodes';

const router = Router();

// ─── ADMIN / INSTRUCTOR: Student Management ──────────────────────────────────

/** POST /api/students — Register a new student */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_STUDENT_CREATE_ALL, PermissionCode.STM_STUDENT_CREATE_OWN_DEPARTMENT, PermissionCode.RECEP_STUDENT_REGISTER),
  StudentController.register
);

/** GET /api/students — List students with filters */
router.get(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_STUDENT_READ_ALL, PermissionCode.STM_STUDENT_READ_OWN_DEPARTMENT),
  StudentController.list
);

/** GET /api/students/:id — Get single student */
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_STUDENT_READ_ALL, PermissionCode.STM_STUDENT_READ_OWN_DEPARTMENT),
  StudentController.getById
);

/** PATCH /api/students/:id — Update student profile */
router.patch(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_STUDENT_UPDATE_ALL, PermissionCode.STM_STUDENT_UPDATE_OWN_DEPARTMENT),
  StudentController.update
);

/** PATCH /api/students/:id/status — Suspend / activate / graduate */
router.patch(
  '/:id/status',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_STUDENT_SUSPEND_ALL, PermissionCode.STM_STUDENT_SUSPEND_OWN_DEPARTMENT, PermissionCode.STM_STUDENT_UPDATE_ALL, PermissionCode.STM_STUDENT_UPDATE_OWN_DEPARTMENT),
  StudentController.updateStatus
);

/** DELETE /api/students/:id — Remove a student (no department-scoped
 * variant exists; HOD removes access via the Suspend status instead) */
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_STUDENT_DELETE_ALL),
  StudentController.remove
);

/** POST /api/students/:id/enroll — Enroll student in a course */
router.post(
  '/:id/enroll',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_ENROLLMENT_CREATE_ALL, PermissionCode.STM_STUDENT_UPDATE_OWN_DEPARTMENT),
  StudentController.enroll
);

/** GET /api/students/:id/enrollments — Get student enrollments */
router.get(
  '/:id/enrollments',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_ENROLLMENT_READ_ALL),
  StudentController.getEnrollments
);

/** POST /api/students/attendance/mark — Mark attendance for a class */
router.post(
  '/attendance/mark',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_ATTENDANCE_MARK_ALL, PermissionCode.INST_ATTENDANCE_MARK_OWN_CLASS),
  StudentController.markAttendance
);

/** GET /api/students/:id/attendance — Get student attendance */
router.get(
  '/:id/attendance',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_ATTENDANCE_READ_ALL, PermissionCode.INST_ATTENDANCE_READ_OWN_CLASS),
  StudentController.getAttendance
);

/** POST /api/students/:id/results — Record a result */
router.post(
  '/:id/results',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_RESULT_CREATE_ALL),
  StudentController.recordResult
);

/** GET /api/students/:id/results — Get student results */
router.get(
  '/:id/results',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_RESULT_READ_ALL, PermissionCode.INST_EXAM_RESULT_READ_OWN_COURSE),
  StudentController.getResults
);

/** GET /api/students/:id/analytics — Performance analytics */
router.get(
  '/:id/analytics',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STM_ANALYTICS_VIEW_ALL),
  StudentController.getAnalytics
);

// ─── STUDENT PORTAL: Self-service endpoints ───────────────────────────────────

/** GET /api/students/portal/me — Student self profile */
router.get(
  '/portal/me',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STU_PROFILE_READ_OWN),
  StudentController.getMyProfile
);

/** PATCH /api/students/portal/me — Update own profile */
router.patch(
  '/portal/me',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STU_PROFILE_UPDATE_OWN),
  StudentController.updateMyProfile
);

/** GET /api/students/portal/enrollments — Own enrollments */
router.get(
  '/portal/enrollments',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STU_COURSE_VIEW_ENROLLED),
  StudentController.getMyEnrollments
);

/** GET /api/students/portal/attendance — Own attendance */
router.get(
  '/portal/attendance',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STU_ATTENDANCE_READ_OWN),
  StudentController.getMyAttendance
);

/** GET /api/students/portal/results — Own results */
router.get(
  '/portal/results',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STU_RESULT_READ_OWN),
  StudentController.getMyResults
);

/** GET /api/students/portal/analytics — Own analytics */
router.get(
  '/portal/analytics',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STU_PROGRESS_READ_OWN),
  StudentController.getMyAnalytics
);

/** GET /api/students/portal/schedule — Own class schedule */
router.get(
  '/portal/schedule',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.STU_SCHEDULE_READ_OWN),
  StudentController.getMySchedule
);

export default router;
