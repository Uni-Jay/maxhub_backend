"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const BaseService_1 = require("./BaseService");
const PermissionCodes_1 = require("../config/PermissionCodes");
const crypto_1 = __importDefault(require("crypto"));
class AttendanceService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.MIN_GPS_ACCURACY = 100;
        this.QR_VALID_DURATION = 5;
        this.MAX_GPS_DRIFT = 5000;
        this.GEOHASH_PRECISION = 6;
    }
    async validateManagerAuthority(req, staffId) {
    }
    async clockIn(req, staffId, clockInData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.ATT_CLOCKIN_CREATE_OWN);
        if (clockInData.accuracy && clockInData.accuracy > this.MIN_GPS_ACCURACY) {
            throw new Error('GPS accuracy too low for check-in (required: <100m)');
        }
        const currentGeohash = this.getGeohash(clockInData.latitude, clockInData.longitude);
        const validGeohashes = await this.getValidClockInGeohashes(staffId);
        if (!validGeohashes.includes(currentGeohash)) {
            throw new Error('Location not authorized for clock-in. Please visit office.');
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const gpsRecord = {
            staffId,
            latitude: clockInData.latitude,
            longitude: clockInData.longitude,
            accuracy: clockInData.accuracy,
            geohash: currentGeohash,
            timestamp: new Date(),
            isValidLocation: (clockInData.accuracy || 0) <= this.MIN_GPS_ACCURACY,
        };
        const attendanceRecord = {
            staffId,
            attendanceDate: today,
            checkInTime: new Date(),
            checkInLatitude: clockInData.latitude,
            checkInLongitude: clockInData.longitude,
            checkInIpAddress: clockInData.ipAddress,
            status: 'Present',
            approvalStatus: 'Pending',
        };
        return {
            message: 'Clocked in successfully',
            checkInTime: new Date(),
            gpsAccuracy: clockInData.accuracy,
            geohash: currentGeohash,
        };
    }
    async clockOut(req, staffId, clockOutData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.ATT_CLOCKOUT_CREATE_OWN);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentGeohash = this.getGeohash(clockOutData.latitude, clockOutData.longitude);
        const gpsRecord = {
            staffId,
            latitude: clockOutData.latitude,
            longitude: clockOutData.longitude,
            accuracy: clockOutData.accuracy,
            geohash: currentGeohash,
            timestamp: new Date(),
            isValidLocation: (clockOutData.accuracy || 0) <= this.MIN_GPS_ACCURACY,
        };
        return {
            message: 'Clocked out successfully',
            checkOutTime: new Date(),
            gpsAccuracy: clockOutData.accuracy,
            geohash: currentGeohash,
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
    getGeohash(latitude, longitude) {
        return 'ezs42';
    }
    async getValidClockInGeohashes(staffId) {
        return ['ezs42', 'ezs43', 'ezs44'];
    }
    geohashDistance(hash1, hash2) {
        return 0;
    }
}
exports.AttendanceService = AttendanceService;
//# sourceMappingURL=AttendanceService.js.map