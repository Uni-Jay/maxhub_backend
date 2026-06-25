"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const BaseService_1 = require("./BaseService");
const PermissionCodes_1 = require("../config/PermissionCodes");
const crypto_1 = __importDefault(require("crypto"));
const Attendance_model_1 = require("../models/Attendance.model");
class AttendanceService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.QR_VALID_DURATION = 5;
    }
    async validateManagerAuthority(req, staffId) {
    }
    async clockIn(req, staffId, clockInData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.ATT_CLOCKIN_CREATE_OWN);
        const today = new Date().toISOString().slice(0, 10);
        const [record, created] = await Attendance_model_1.Attendance.findOrCreate({
            where: { staffId, attendanceDate: today },
            defaults: {
                staffId,
                attendanceDate: today,
                checkInTime: new Date(),
                checkInLatitude: clockInData.latitude || null,
                checkInLongitude: clockInData.longitude || null,
                checkInIpAddress: clockInData.ipAddress,
                status: 'Present',
                approvalStatus: 'Pending',
            },
        });
        if (!created) {
            if (record.checkInTime) {
                throw new Error('Already clocked in today');
            }
            await record.update({
                checkInTime: new Date(),
                checkInLatitude: clockInData.latitude || null,
                checkInLongitude: clockInData.longitude || null,
                checkInIpAddress: clockInData.ipAddress,
                status: 'Present',
            });
        }
        return {
            message: 'Clocked in successfully',
            checkInTime: record.checkInTime,
        };
    }
    async clockOut(req, staffId, clockOutData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.ATT_CLOCKOUT_CREATE_OWN);
        const today = new Date().toISOString().slice(0, 10);
        const record = await Attendance_model_1.Attendance.findOne({ where: { staffId, attendanceDate: today } });
        if (!record || !record.checkInTime) {
            throw new Error('Not clocked in today');
        }
        if (record.checkOutTime) {
            throw new Error('Already clocked out today');
        }
        const checkOutTime = new Date();
        const workingHours = (checkOutTime.getTime() - new Date(record.checkInTime).getTime()) / (1000 * 60 * 60);
        await record.update({
            checkOutTime,
            checkOutLatitude: clockOutData.latitude || null,
            checkOutLongitude: clockOutData.longitude || null,
            checkOutIpAddress: clockOutData.ipAddress,
            workingHours: Math.round(workingHours * 100) / 100,
        });
        return {
            message: 'Clocked out successfully',
            checkOutTime: record.checkOutTime,
            workingHours: record.workingHours,
        };
    }
    async generateQRCode(req, organizationId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.ATT_QR_GENERATE_ALL);
        const expiresAt = new Date(Date.now() + this.QR_VALID_DURATION * 60 * 1000);
        return {
            qrCode: Buffer.from(JSON.stringify({ organizationId, expiresAt })).toString('base64'),
            expiresAt,
            validFor: this.QR_VALID_DURATION,
        };
    }
    async scanQRCode(req, staffId, qrToken, location) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.ATT_QR_USE_OWN);
        return this.clockIn(req, staffId, location);
    }
    async approveOvertime(req, overtimeId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.ATT_OVERTIME_APPROVE_ALL);
        return { message: 'Overtime approved' };
    }
    async generateAttendanceReport(req, staffId, startDate, endDate) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.ATT_REPORTS_GENERATE_ALL);
        return {
            message: 'Report generation started',
            jobId: crypto_1.default.randomUUID(),
            status: 'Queued',
            estimatedTime: '5 minutes',
            checkStatusUrl: '/api/reports/{jobId}',
        };
    }
}
exports.AttendanceService = AttendanceService;
//# sourceMappingURL=AttendanceService.js.map