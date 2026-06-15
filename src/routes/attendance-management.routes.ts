import { Router, Request, Response } from 'express';
import AuthMiddleware from '../middleware/AuthMiddleware';
import { PermissionCode } from '../config/PermissionCodes';
import { AttendanceService, ClockInRequest, ClockOutRequest } from '../services/AttendanceService';
import { Attendance } from '../models/Attendance.model';
import { Staff } from '../models/Staff.model';

const router = Router();
const attendanceService = new AttendanceService();

/**
 * GET /api/attendance
 * List attendance records with optional date filter
 */
router.get(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_ATTENDANCE_READ_ALL),
  async (req: Request, res: Response) => {
    try {
      const { date, page = '1', limit = '20' } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, parseInt(limit));
      const offset = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {};
      if (date) where.date = date;

      const { count, rows } = await Attendance.findAndCountAll({
        where,
        include: [{ model: Staff, attributes: ['id', 'firstName', 'lastName', 'employeeId'] }],
        limit: limitNum,
        offset,
        order: [['date', 'DESC'], ['checkInTime', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * GET /api/attendance/today
 * Get the current user's attendance record for today
 */
router.get(
  '/today',
  AuthMiddleware.verifyToken,
  async (req: Request, res: Response) => {
    try {
      const staffId = (req as unknown as { user: { staffId: bigint } }).user.staffId;
      const today = new Date().toISOString().slice(0, 10);
      const record = await (Attendance as any).findOne({
        where: { staffId, date: today },
      }) as InstanceType<typeof Attendance> | null;
      if (!record) {
        return res.status(404).json({ success: false, message: 'No record for today' });
      }
      res.json({ success: true, data: record });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * POST /api/attendance/clock-in
 * Clock in for the day
 */
router.post(
  '/clock-in',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_CLOCKIN_CREATE_OWN),
  async (req: Request, res: Response) => {
    try {
      const staffId = (req as any).user.staffId;
      const clockInData: ClockInRequest = req.body;
      const result = await attendanceService.clockIn(req, staffId, clockInData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * POST /api/attendance/clock-out
 * Clock out for the day
 */
router.post(
  '/clock-out',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_CLOCKOUT_CREATE_OWN),
  async (req: Request, res: Response) => {
    try {
      const staffId = (req as any).user.staffId;
      const clockOutData: ClockOutRequest = req.body;
      const result = await attendanceService.clockOut(req, staffId, clockOutData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * GET /api/attendance/gps/track
 * Get GPS tracking data
 */
router.get(
  '/gps/track',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_GPS_READ_OWN),
  async (req: Request, res: Response) => {
    try {
      // Implementation would query GPS tracking records
      res.json({
        success: true,
        data: {
          trackingData: [],
          locations: [],
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * POST /api/attendance/qr/generate
 * Generate QR code for attendance
 */
router.post(
  '/qr/generate',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_QR_GENERATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const organizationId = (req as any).user.organizationId;
      const result = await attendanceService.generateQRCode(req, organizationId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * POST /api/attendance/qr/scan
 * Scan QR code for quick attendance
 */
router.post(
  '/qr/scan',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_QR_USE_OWN),
  async (req: Request, res: Response) => {
    try {
      const staffId = (req as any).user.staffId;
      const { qrToken, location } = req.body;
      const result = await attendanceService.scanQRCode(req, staffId, qrToken, location);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * POST /api/attendance/overtime/request
 * Request overtime
 */
router.post(
  '/overtime/request',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_ATTENDANCE_CREATE_OWN),
  async (req: Request, res: Response) => {
    try {
      res.json({ success: true, data: { message: 'Overtime request submitted' } });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * PUT /api/attendance/overtime/:id/approve
 * Approve overtime request
 */
router.put(
  '/overtime/:id/approve',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_OVERTIME_APPROVE_ALL),
  async (req: Request, res: Response) => {
    try {
      const overtimeId = BigInt(req.params.id);
      const result = await attendanceService.approveOvertime(req, overtimeId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * POST /api/attendance/reports/generate
 * Generate attendance report
 */
router.post(
  '/reports/generate',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_REPORTS_GENERATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const { staffId, startDate, endDate } = req.body;
      const result = await attendanceService.generateAttendanceReport(
        req,
        staffId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

export default router;
