"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const PermissionCodes_1 = require("../config/PermissionCodes");
const AttendanceService_1 = require("../services/AttendanceService");
const Attendance_model_1 = require("../models/Attendance.model");
const Staff_model_1 = require("../models/Staff.model");
const Overtime_model_1 = require("../models/Overtime.model");
const router = (0, express_1.Router)();
const attendanceService = new AttendanceService_1.AttendanceService();
function isBypassRole(req) {
    const roles = (req.user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    return roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin');
}
function hasPermission(req, code) {
    if (isBypassRole(req))
        return true;
    const perms = new Set((req.user?.permissions || []).map((p) => String(p).toLowerCase()));
    return perms.has(code.toLowerCase());
}
async function getOwnStaffId(req) {
    const userId = req.user?.id;
    if (!userId)
        return null;
    const staff = await Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id'] });
    return staff ? staff.id : null;
}
router.get('/', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_READ_ALL, PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_READ_OWN_DEPARTMENT, PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_READ_OWN), async (req, res) => {
    try {
        const { date, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, parseInt(limit));
        const offset = (pageNum - 1) * limitNum;
        const where = {};
        if (date)
            where.attendanceDate = date;
        if (!hasPermission(req, PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_READ_ALL)) {
            const userId = req.user?.id;
            const ownStaff = await Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id', 'departmentId'] });
            if (!ownStaff) {
                return res.json({ success: true, data: [], pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 } });
            }
            if (hasPermission(req, PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_READ_OWN_DEPARTMENT)) {
                const deptStaff = await Staff_model_1.Staff.findAll({ where: { departmentId: ownStaff.departmentId }, attributes: ['id'] });
                where.staffId = { [sequelize_1.Op.in]: deptStaff.map((s) => s.id) };
            }
            else {
                where.staffId = ownStaff.id;
            }
        }
        const { count, rows } = await Attendance_model_1.Attendance.findAndCountAll({
            where,
            include: [{ model: Staff_model_1.Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }],
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/today', AuthMiddleware_1.default.verifyToken, async (req, res) => {
    try {
        const staffId = await getOwnStaffId(req);
        if (!staffId) {
            return res.status(404).json({ success: false, message: 'No staff profile linked to this account' });
        }
        const today = new Date().toISOString().slice(0, 10);
        const record = await Attendance_model_1.Attendance.findOne({
            where: { staffId, attendanceDate: today },
        });
        if (!record) {
            return res.status(404).json({ success: false, message: 'No record for today' });
        }
        res.json({ success: true, data: record });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/clock-in', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_CLOCKIN_CREATE_OWN), async (req, res) => {
    try {
        const staffId = await getOwnStaffId(req);
        if (!staffId)
            return res.status(400).json({ success: false, error: 'No staff profile linked to this account' });
        const clockInData = req.body;
        const result = await attendanceService.clockIn(req, staffId, clockInData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/clock-out', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_CLOCKOUT_CREATE_OWN), async (req, res) => {
    try {
        const staffId = await getOwnStaffId(req);
        if (!staffId)
            return res.status(400).json({ success: false, error: 'No staff profile linked to this account' });
        const clockOutData = req.body;
        const result = await attendanceService.clockOut(req, staffId, clockOutData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/manual-mark', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_MARK_ALL), async (req, res) => {
    try {
        const { staffId, attendanceDate, status, checkInTime, checkOutTime, remarks } = req.body;
        if (!staffId || !attendanceDate || !status) {
            return res.status(400).json({ success: false, message: 'staffId, attendanceDate and status are required' });
        }
        const [record] = await Attendance_model_1.Attendance.findOrCreate({
            where: { staffId, attendanceDate },
            defaults: { staffId, attendanceDate, status, approvalStatus: 'Pending' },
        });
        await record.update({
            status,
            checkInTime: checkInTime ? new Date(checkInTime) : record.checkInTime,
            checkOutTime: checkOutTime ? new Date(checkOutTime) : record.checkOutTime,
            remarks,
            approvedBy: req.user.id,
            approvalStatus: 'Approved',
        });
        res.json({ success: true, data: record });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.get('/gps/track', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_GPS_READ_OWN), async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                trackingData: [],
                locations: [],
            },
        });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/qr/generate', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_QR_GENERATE_ALL), async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const result = await attendanceService.generateQRCode(req, organizationId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/qr/scan', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_QR_USE_OWN), async (req, res) => {
    try {
        const staffId = await getOwnStaffId(req);
        if (!staffId)
            return res.status(400).json({ success: false, error: 'No staff profile linked to this account' });
        const { qrToken, location } = req.body;
        const result = await attendanceService.scanQRCode(req, staffId, qrToken, location);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/overtime/request', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_CREATE_OWN), async (req, res) => {
    try {
        const staffId = await getOwnStaffId(req);
        if (!staffId)
            return res.status(400).json({ success: false, error: 'No staff profile linked to this account' });
        const { attendanceId, date, startTime, endTime, overtimeHours, overtimeRate, reason } = req.body;
        if (!attendanceId || !date || !startTime || !endTime || !overtimeHours) {
            return res.status(400).json({ success: false, message: 'attendanceId, date, startTime, endTime and overtimeHours are required' });
        }
        const overtime = await Overtime_model_1.Overtime.create({
            staffId,
            attendanceId,
            date,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            overtimeHours,
            overtimeRate: overtimeRate ?? 1.5,
            reason,
            status: 'Pending',
        });
        res.json({ success: true, data: overtime });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/overtime/:id/approve', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_OVERTIME_APPROVE_ALL), async (req, res) => {
    try {
        const overtime = await Overtime_model_1.Overtime.findByPk(req.params.id);
        if (!overtime)
            return res.status(404).json({ success: false, message: 'Overtime request not found' });
        await overtime.update({ status: 'Approved', approvedBy: req.user.id });
        res.json({ success: true, data: overtime });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/overtime/:id/reject', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_OVERTIME_APPROVE_ALL), async (req, res) => {
    try {
        const overtime = await Overtime_model_1.Overtime.findByPk(req.params.id);
        if (!overtime)
            return res.status(404).json({ success: false, message: 'Overtime request not found' });
        await overtime.update({ status: 'Rejected', approvedBy: req.user.id });
        res.json({ success: true, data: overtime });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/reports/generate', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_REPORTS_GENERATE_ALL), async (req, res) => {
    try {
        const { staffId, startDate, endDate } = req.body;
        const result = await attendanceService.generateAttendanceReport(req, staffId, new Date(startDate), new Date(endDate));
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=attendance-management.routes.js.map