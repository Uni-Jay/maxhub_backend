"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const PermissionCodes_1 = require("../config/PermissionCodes");
const AttendanceService_1 = require("../services/AttendanceService");
const Attendance_model_1 = require("../models/Attendance.model");
const Staff_model_1 = require("../models/Staff.model");
const router = (0, express_1.Router)();
const attendanceService = new AttendanceService_1.AttendanceService();
router.get('/', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_READ_ALL), async (req, res) => {
    try {
        const { date, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, parseInt(limit));
        const offset = (pageNum - 1) * limitNum;
        const where = {};
        if (date)
            where.attendanceDate = date;
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
        const staffId = req.user?.staffId;
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
        const staffId = req.user.staffId;
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
        const staffId = req.user.staffId;
        const clockOutData = req.body;
        const result = await attendanceService.clockOut(req, staffId, clockOutData);
        res.json({ success: true, data: result });
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
        const staffId = req.user.staffId;
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
        res.json({ success: true, data: { message: 'Overtime request submitted' } });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/overtime/:id/approve', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.ATT_OVERTIME_APPROVE_ALL), async (req, res) => {
    try {
        const overtimeId = BigInt(req.params.id);
        const result = await attendanceService.approveOvertime(req, overtimeId);
        res.json({ success: true, data: result });
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