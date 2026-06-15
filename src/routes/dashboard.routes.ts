import { Router } from 'express';
import { DashboardController } from '@controllers/DashboardController';
import AuthMiddleware from '../middleware/AuthMiddleware';

const router = Router();

// Super Admin Dashboard
router.get('/super-admin/stats', AuthMiddleware.verifyToken, DashboardController.getSuperAdminStats);
router.get('/super-admin/attendance', AuthMiddleware.verifyToken, DashboardController.getSuperAdminAttendance);
router.get('/super-admin/revenue', AuthMiddleware.verifyToken, DashboardController.getSuperAdminRevenue);
router.get('/super-admin/payroll', AuthMiddleware.verifyToken, DashboardController.getSuperAdminPayroll);
router.get('/super-admin/departments', AuthMiddleware.verifyToken, DashboardController.getSuperAdminDepartments);
router.get('/super-admin/students', AuthMiddleware.verifyToken, DashboardController.getSuperAdminStudents);
router.get('/super-admin/projects', AuthMiddleware.verifyToken, DashboardController.getSuperAdminProjects);
router.get('/super-admin/crm', AuthMiddleware.verifyToken, DashboardController.getSuperAdminCRM);
router.get('/super-admin/notifications', AuthMiddleware.verifyToken, DashboardController.getSuperAdminNotifications);

// Head of Admin Dashboard
router.get('/head-of-admin/stats', AuthMiddleware.verifyToken, DashboardController.getHeadOfAdminStats);
router.get('/head-of-admin/leave-approvals/pending', AuthMiddleware.verifyToken, DashboardController.getHeadOfAdminLeaveApprovals);
router.post('/head-of-admin/leave-approvals/:leaveId/approve', AuthMiddleware.verifyToken, DashboardController.approveLeave);
router.post('/head-of-admin/leave-approvals/:leaveId/reject', AuthMiddleware.verifyToken, DashboardController.rejectLeave);
router.get('/head-of-admin/attendance-reports', AuthMiddleware.verifyToken, DashboardController.getHeadOfAdminAttendanceReports);
router.get('/head-of-admin/department-kpis', AuthMiddleware.verifyToken, DashboardController.getHeadOfAdminDepartmentKPIs);
router.get('/head-of-admin/projects', AuthMiddleware.verifyToken, DashboardController.getHeadOfAdminProjects);
router.get('/head-of-admin/communications', AuthMiddleware.verifyToken, DashboardController.getHeadOfAdminCommunications);
router.get('/head-of-admin/leave-summary', AuthMiddleware.verifyToken, DashboardController.getHeadOfAdminLeaveSummary);

export default router;
