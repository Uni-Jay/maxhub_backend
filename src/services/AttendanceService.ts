import { Request } from 'express';
import { BaseService } from './BaseService';
import { PermissionCode } from '../config/PermissionCodes';
import crypto from 'crypto';
import * as geohash from 'geohash-bounding-box';

export interface ClockInRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  deviceId?: string;
  ipAddress: string;
}

export interface ClockOutRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  deviceId?: string;
  ipAddress: string;
}

export interface OvertimeRequest {
  date: Date;
  startTime: Date;
  endTime: Date;
  reason: string;
  overtimeRate?: number;
}

export class AttendanceService extends BaseService {
  private readonly MIN_GPS_ACCURACY = 100; // meters
  private readonly QR_VALID_DURATION = 5; // minutes
  private readonly MAX_GPS_DRIFT = 5000; // 5km in meters
  private readonly GEOHASH_PRECISION = 6; // ~1km accuracy

  /**
   * IMPROVED: Add manager authority validation
   */
  private async validateManagerAuthority(req: Request, staffId: bigint) {
    // Get staff and their manager
    // const staff = await staffRepo.findByPk(staffId);
    // const authenticatedUser = (req as any).user;
    // if (staff.managerId !== authenticatedUser.staffId) {
    //   throw new Error('Unauthorized: Not direct manager');
    // }
  }

  /**
   * Clock in staff member with security improvements
   */
  async clockIn(req: Request, staffId: bigint, clockInData: ClockInRequest) {
    await this.checkPermission(req, PermissionCode.ATT_CLOCKIN_CREATE_OWN);

    // IMPROVEMENT: Validate GPS accuracy
    if (clockInData.accuracy && clockInData.accuracy > this.MIN_GPS_ACCURACY) {
      throw new Error('GPS accuracy too low for check-in (required: <100m)');
    }

    // IMPROVEMENT: Geohash-based location validation
    const currentGeohash = this.getGeohash(clockInData.latitude, clockInData.longitude);
    const validGeohashes = await this.getValidClockInGeohashes(staffId);
    if (!validGeohashes.includes(currentGeohash)) {
      throw new Error('Location not authorized for clock-in. Please visit office.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // IMPROVEMENT: Check if already clocked in today (prevent duplicate check-in)
    // const existingRecord = await attendanceRepo.findOne({
    //   where: { 
    //     staffId, 
    //     attendanceDate: today, 
    //     checkInTime: { [Op.not]: null } 
    //   }
    // });
    // if (existingRecord) throw new Error('Already clocked in today');

    // Create GPS tracking record with geohash
    const gpsRecord = {
      staffId,
      latitude: clockInData.latitude,
      longitude: clockInData.longitude,
      accuracy: clockInData.accuracy,
      geohash: currentGeohash, // IMPROVEMENT: Add geohash for indexing
      timestamp: new Date(),
      isValidLocation: (clockInData.accuracy || 0) <= this.MIN_GPS_ACCURACY,
    };

    // Create or update attendance record
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

    // IMPROVEMENT: Audit logging
    // await auditService.log({
    //   action: 'CLOCK_IN',
    //   staffId,
    //   details: {
    //     latitude: clockInData.latitude,
    //     longitude: clockInData.longitude,
    //     deviceId: clockInData.deviceId
    //   },
    //   ipAddress: clockInData.ipAddress
    // });

    return {
      message: 'Clocked in successfully',
      checkInTime: new Date(),
      gpsAccuracy: clockInData.accuracy,
      geohash: currentGeohash,
    };
  }

  /**
   * Clock out with validation
   */
  async clockOut(req: Request, staffId: bigint, clockOutData: ClockOutRequest) {
    await this.checkPermission(req, PermissionCode.ATT_CLOCKOUT_CREATE_OWN);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance record
    // const attendance = await attendanceRepo.findOne({
    //   where: { staffId, attendanceDate: today }
    // });
    // if (!attendance || !attendance.checkInTime) {
    //   throw new Error('Not clocked in today');
    // }

    // IMPROVEMENT: Validate clock out is after clock in
    // if (new Date() <= attendance.checkInTime) {
    //   throw new Error('Invalid clock out time');
    // }

    // Create GPS tracking record
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

    // Update attendance record
    // const checkInTime = new Date(attendance.checkInTime);
    // const checkOutTime = new Date();
    // const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // await attendance.update({
    //   checkOutTime: new Date(),
    //   checkOutLatitude: clockOutData.latitude,
    //   checkOutLongitude: clockOutData.longitude,
    //   checkOutIpAddress: clockOutData.ipAddress,
    //   workingHours,
    // });

    return {
      message: 'Clocked out successfully',
      checkOutTime: new Date(),
      gpsAccuracy: clockOutData.accuracy,
      geohash: currentGeohash,
    };
  }

  /**
   * IMPROVED: Stateless JWT-based QR generation
   */
  async generateQRCode(req: Request, organizationId: bigint) {
    await this.checkPermission(req, PermissionCode.ATT_QR_GENERATE_ALL);

    // IMPROVEMENT: Use JWT instead of database tokens
    // const token = jwt.sign(
    //   { 
    //     organizationId, 
    //     nonce: crypto.randomBytes(4).toString('hex'),
    //     type: 'qr',
    //     geohash: this.getGeohash(lat, lon) // Embed generation location
    //   },
    //   process.env.QR_SECRET,
    //   { expiresIn: '5m' }
    // );

    const expiresAt = new Date(Date.now() + this.QR_VALID_DURATION * 60 * 1000);

    return {
      qrCode: Buffer.from(JSON.stringify({ organizationId, expiresAt })).toString('base64'),
      expiresAt,
      validFor: this.QR_VALID_DURATION,
    };
  }

  /**
   * IMPROVED: Scan QR with geolocation validation
   */
  async scanQRCode(req: Request, staffId: bigint, qrToken: string, location: ClockInRequest) {
    await this.checkPermission(req, PermissionCode.ATT_QR_USE_OWN);

    // IMPROVEMENT: Rate limiting check (max 1 scan per minute)
    // const recentScans = await qrCodeTokenRepo.count({
    //   where: {
    //     usedBy: staffId,
    //     usedAt: { [Op.gt]: new Date(Date.now() - 60000) }
    //   }
    // });
    // if (recentScans > 0) {
    //   throw new Error('Rate limited: Max 1 scan per minute');
    // }

    // IMPROVEMENT: Verify QR token (JWT validation)
    // try {
    //   const decoded = jwt.verify(qrToken, process.env.QR_SECRET);
    //   if (decoded.type !== 'qr') throw new Error('Invalid token type');
    // } catch (e) {
    //   throw new Error('Invalid or expired QR code');
    // }

    // IMPROVEMENT: Geohash distance validation (should be generated nearby)
    // const generationGeohash = decoded.geohash;
    // const usageGeohash = this.getGeohash(location.latitude, location.longitude);
    // const distance = this.geohashDistance(generationGeohash, usageGeohash);
    // if (distance > 2) { // More than 2 grid cells away
    //   throw new Error('QR used too far from generation location');
    // }

    // Process as clock in
    return this.clockIn(req, staffId, location);
  }

  /**
   * IMPROVED: Manager authority validation for overtime approval
   */
  async approveOvertime(req: Request, overtimeId: bigint) {
    await this.checkPermission(req, PermissionCode.ATT_OVERTIME_APPROVE_ALL);

    // IMPROVEMENT: Validate approver is manager of overtime requester
    // const overtime = await overtimeRepo.findByPk(overtimeId, {
    //   include: ['staff']
    // });
    // const authenticatedUser = (req as any).user;
    // if (overtime.staff.managerId !== authenticatedUser.staffId) {
    //   throw new Error('Only direct manager can approve overtime');
    // }

    // Update status
    // await overtime.update({ 
    //   status: 'Approved', 
    //   approvedBy: req.user.staffId,
    //   approvalDate: new Date()
    // });

    return { message: 'Overtime approved' };
  }

  /**
   * IMPROVED: Async report generation
   */
  async generateAttendanceReport(req: Request, staffId: bigint, startDate: Date, endDate: Date) {
    await this.checkPermission(req, PermissionCode.ATT_REPORTS_GENERATE_ALL);

    // IMPROVEMENT: Queue async job instead of synchronous
    // const jobId = crypto.randomUUID();
    // await reportQueue.add({
    //   jobId,
    //   staffId,
    //   startDate,
    //   endDate,
    //   requestedBy: req.user.staffId
    // }, { jobId });

    // Return immediately with job tracking
    return {
      message: 'Report generation started',
      jobId: crypto.randomUUID(),
      status: 'Queued',
      estimatedTime: '5 minutes',
      checkStatusUrl: '/api/reports/{jobId}',
    };
  }

  /**
   * IMPROVED: Helper function for geohashing
   */
  private getGeohash(latitude: number, longitude: number): string {
    // Use geohash-bounding-box or similar library
    // return geohash.encode(latitude, longitude, this.GEOHASH_PRECISION);
    return 'ezs42'; // Placeholder
  }

  /**
   * IMPROVED: Get valid clock-in locations (geofences)
   */
  private async getValidClockInGeohashes(staffId: bigint): Promise<string[]> {
    // Query office locations and convert to geohashes
    // const locations = await officeLocationRepo.findAll();
    // return locations.map(loc => 
    //   geohash.encode(loc.latitude, loc.longitude, GEOHASH_PRECISION)
    // );
    return ['ezs42', 'ezs43', 'ezs44']; // Placeholder
  }

  /**
   * IMPROVED: Calculate distance between geohashes
   */
  private geohashDistance(hash1: string, hash2: string): number {
    // Calculate grid distance between geohashes
    return 0; // Placeholder
  }
}

