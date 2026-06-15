import { Request } from 'express';
import { BaseService } from './BaseService';
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
export declare class AttendanceService extends BaseService {
    private readonly MIN_GPS_ACCURACY;
    private readonly QR_VALID_DURATION;
    private readonly MAX_GPS_DRIFT;
    private readonly GEOHASH_PRECISION;
    private validateManagerAuthority;
    clockIn(req: Request, staffId: bigint, clockInData: ClockInRequest): Promise<{
        message: string;
        checkInTime: Date;
        gpsAccuracy: number | undefined;
        geohash: string;
    }>;
    clockOut(req: Request, staffId: bigint, clockOutData: ClockOutRequest): Promise<{
        message: string;
        checkOutTime: Date;
        gpsAccuracy: number | undefined;
        geohash: string;
    }>;
    generateQRCode(req: Request, organizationId: bigint): Promise<{
        qrCode: string;
        expiresAt: Date;
        validFor: number;
    }>;
    scanQRCode(req: Request, staffId: bigint, qrToken: string, location: ClockInRequest): Promise<{
        message: string;
        checkInTime: Date;
        gpsAccuracy: number | undefined;
        geohash: string;
    }>;
    approveOvertime(req: Request, overtimeId: bigint): Promise<{
        message: string;
    }>;
    generateAttendanceReport(req: Request, staffId: bigint, startDate: Date, endDate: Date): Promise<{
        message: string;
        jobId: `${string}-${string}-${string}-${string}-${string}`;
        status: string;
        estimatedTime: string;
        checkStatusUrl: string;
    }>;
    private getGeohash;
    private getValidClockInGeohashes;
    private geohashDistance;
}
//# sourceMappingURL=AttendanceService.d.ts.map