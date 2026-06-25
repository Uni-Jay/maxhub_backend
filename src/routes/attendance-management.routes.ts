import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import AuthMiddleware from '../middleware/AuthMiddleware';
import { PermissionCode } from '../config/PermissionCodes';
import { AttendanceService, ClockInRequest, ClockOutRequest } from '../services/AttendanceService';
import { Attendance } from '../models/Attendance.model';
import { Staff } from '../models/Staff.model';
import { Overtime } from '../models/Overtime.model';

const router = Router();
const attendanceService = new AttendanceService();

function isBypassRole(req: Request): boolean {
  const roles = ((req as any).user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  return roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin');
}

function hasPermission(req: Request, code: string): boolean {
  if (isBypassRole(req)) return true;
  const perms = new Set(((req as any).user?.permissions || []).map((p: string) => String(p).toLowerCase()));
  return perms.has(code.toLowerCase());
}

// The JWT/session user object never carries a staffId field - it must be
// resolved from the Staff row linked to the logged-in user, same pattern
// used in project.routes.ts/task.routes.ts/weekly-report.routes.ts.
async function getOwnStaffId(req: Request): Promise<bigint | null> {
  const userId = (req as any).user?.id;
  if (!userId) return null;
  const staff = await Staff.findOne({ where: { userId }, attributes: ['id'] });
  return staff ? (staff as any).id : null;
}

/**
 * GET /api/attendance
 * List attendance records with optional date filter.
 * Scoped by whichever read permission the caller actually has: ALL (everyone),
 * OWN_DEPARTMENT (HOD — her department's staff only), or OWN (staff — herself only).
 */
router.get(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(
    PermissionCode.ATT_ATTENDANCE_READ_ALL,
    PermissionCode.ATT_ATTENDANCE_READ_OWN_DEPARTMENT,
    PermissionCode.ATT_ATTENDANCE_READ_OWN
  ),
  async (req: Request, res: Response) => {
    try {
      const { date, page = '1', limit = '20' } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, parseInt(limit));
      const offset = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {};
      if (date) where.attendanceDate = date;

      if (!hasPermission(req, PermissionCode.ATT_ATTENDANCE_READ_ALL)) {
        const userId = (req as any).user?.id;
        const ownStaff = await Staff.findOne({ where: { userId }, attributes: ['id', 'departmentId'] });
        if (!ownStaff) {
          return res.json({ success: true, data: [], pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 } });
        }
        if (hasPermission(req, PermissionCode.ATT_ATTENDANCE_READ_OWN_DEPARTMENT)) {
          const deptStaff = await Staff.findAll({ where: { departmentId: (ownStaff as any).departmentId }, attributes: ['id'] });
          where.staffId = { [Op.in]: deptStaff.map((s: any) => s.id) };
        } else {
          where.staffId = (ownStaff as any).id;
        }
      }

      const { count, rows } = await Attendance.findAndCountAll({
        where,
        include: [{ model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }],
        limit: limitNum,
        offset,
        order: [['attendanceDate', 'DESC'], ['checkInTime', 'DESC']],
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
      const staffId = await getOwnStaffId(req);
      if (!staffId) {
        return res.status(404).json({ success: false, message: 'No staff profile linked to this account' });
      }
      const today = new Date().toISOString().slice(0, 10);
      const record = await (Attendance as any).findOne({
        where: { staffId, attendanceDate: today },
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
      const staffId = await getOwnStaffId(req);
      if (!staffId) return res.status(400).json({ success: false, error: 'No staff profile linked to this account' });
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
      const staffId = await getOwnStaffId(req);
      if (!staffId) return res.status(400).json({ success: false, error: 'No staff profile linked to this account' });
      const clockOutData: ClockOutRequest = req.body;
      const result = await attendanceService.clockOut(req, staffId, clockOutData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * POST /api/attendance/manual-mark
 * Mark (or correct) attendance for any staff member on any date — for
 * superadmin / HOD use when a record needs to be entered outside the normal
 * self clock-in/out flow.
 */
router.post(
  '/manual-mark',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_ATTENDANCE_MARK_ALL),
  async (req: Request, res: Response) => {
    try {
      const { staffId, attendanceDate, status, checkInTime, checkOutTime, remarks } = req.body;
      if (!staffId || !attendanceDate || !status) {
        return res.status(400).json({ success: false, message: 'staffId, attendanceDate and status are required' });
      }

      const [record] = await Attendance.findOrCreate({
        where: { staffId, attendanceDate },
        defaults: { staffId, attendanceDate, status, approvalStatus: 'Pending' } as any,
      });

      await record.update({
        status,
        checkInTime: checkInTime ? new Date(checkInTime) : record.checkInTime,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : record.checkOutTime,
        remarks,
        approvedBy: (req as any).user.id,
        approvalStatus: 'Approved',
      } as any);

      res.json({ success: true, data: record });
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
      const staffId = await getOwnStaffId(req);
      if (!staffId) return res.status(400).json({ success: false, error: 'No staff profile linked to this account' });
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
      const staffId = await getOwnStaffId(req);
      if (!staffId) return res.status(400).json({ success: false, error: 'No staff profile linked to this account' });
      const { attendanceId, date, startTime, endTime, overtimeHours, overtimeRate, reason } = req.body;
      if (!attendanceId || !date || !startTime || !endTime || !overtimeHours) {
        return res.status(400).json({ success: false, message: 'attendanceId, date, startTime, endTime and overtimeHours are required' });
      }

      const overtime = await Overtime.create({
        staffId,
        attendanceId,
        date,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        overtimeHours,
        overtimeRate: overtimeRate ?? 1.5,
        reason,
        status: 'Pending',
      } as any);

      res.json({ success: true, data: overtime });
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
      const overtime = await Overtime.findByPk(req.params.id);
      if (!overtime) return res.status(404).json({ success: false, message: 'Overtime request not found' });

      await overtime.update({ status: 'Approved', approvedBy: (req as any).user.id } as any);
      res.json({ success: true, data: overtime });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * PUT /api/attendance/overtime/:id/reject
 * Reject overtime request
 */
router.put(
  '/overtime/:id/reject',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.ATT_OVERTIME_APPROVE_ALL),
  async (req: Request, res: Response) => {
    try {
      const overtime = await Overtime.findByPk(req.params.id);
      if (!overtime) return res.status(404).json({ success: false, message: 'Overtime request not found' });

      await overtime.update({ status: 'Rejected', approvedBy: (req as any).user.id } as any);
      res.json({ success: true, data: overtime });
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
