"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const RBACMiddleware_1 = require("../middleware/RBACMiddleware");
const PermissionCodes_1 = require("../config/PermissionCodes");
const AttendanceService_1 = require("../services/AttendanceService");
const router = (0, express_1.Router)();
const attendanceService = new AttendanceService_1.AttendanceService();
const auth = new AuthMiddleware_1.AuthMiddleware();
const rbac = new RBACMiddleware_1.RBACMiddleware();
router.post('/clock-in', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.ATT_CLOCKIN_CREATE_OWN), async (req, res) => {
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
router.post('/clock-out', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.ATT_CLOCKOUT_CREATE_OWN), async (req, res) => {
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
router.get('/gps/track', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.ATT_GPS_READ_OWN), async (req, res) => {
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
router.post('/qr/generate', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.ATT_QR_GENERATE_ALL), async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const result = await attendanceService.generateQRCode(req, organizationId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/qr/scan', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.ATT_QR_USE_OWN), async (req, res) => {
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
router.post('/overtime/request', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.ATT_ATTENDANCE_CREATE_OWN), async (req, res) => {
    try {
        const staffId = req.user.staffId;
        const result = await attendanceService.requestOvertime(req, staffId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/overtime/:id/approve', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.ATT_OVERTIME_APPROVE_ALL), async (req, res) => {
    try {
        const overtimeId = BigInt(req.params.id);
        const result = await attendanceService.approveOvertime(req, overtimeId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/reports/generate', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.ATT_REPORTS_GENERATE_ALL), async (req, res) => {
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