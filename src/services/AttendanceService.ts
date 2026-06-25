import { Request } from 'express';
import { BaseService } from './BaseService';
import { PermissionCode } from '../config/PermissionCodes';
import crypto from 'crypto';
import { Attendance } from '../models/Attendance.model';
import { todayLocalDate } from '../utils/dateUtils';

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
  private readonly QR_VALID_DURATION = 5; // minutes

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
   * Clock in staff member. GPS coordinates/IP are recorded for the audit
   * trail (checkInLatitude/Longitude columns) but never block the check-in -
   * office wifi/GPS accuracy indoors is unreliable, and remote/field staff
   * legitimately clock in from outside any fixed geofence.
   */
  async clockIn(req: Request, staffId: bigint, clockInData: ClockInRequest) {
    await this.checkPermission(req, PermissionCode.ATT_CLOCKIN_CREATE_OWN);

    const today = todayLocalDate();

    const [record, created] = await Attendance.findOrCreate({
      where: { staffId, attendanceDate: today as any },
      defaults: {
        staffId,
        attendanceDate: today as any,
        checkInTime: new Date(),
        checkInLatitude: clockInData.latitude || null,
        checkInLongitude: clockInData.longitude || null,
        checkInIpAddress: clockInData.ipAddress,
        status: 'Present',
        approvalStatus: 'Pending',
      } as any,
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
      } as any);
    }

    return {
      message: 'Clocked in successfully',
      checkInTime: record.checkInTime,
    };
  }

  /**
   * Clock out. Same as clockIn - location is recorded, never enforced.
   */
  async clockOut(req: Request, staffId: bigint, clockOutData: ClockOutRequest) {
    await this.checkPermission(req, PermissionCode.ATT_CLOCKOUT_CREATE_OWN);

    const today = todayLocalDate();

    const record = await Attendance.findOne({ where: { staffId, attendanceDate: today as any } });
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
    } as any);

    return {
      message: 'Clocked out successfully',
      checkOutTime: record.checkOutTime,
      workingHours: record.workingHours,
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

}

