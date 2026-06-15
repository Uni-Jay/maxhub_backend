import { Model, Optional, Sequelize } from 'sequelize';
interface AttendanceAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    shiftId?: bigint;
    attendanceDate: Date;
    checkInTime?: Date;
    checkOutTime?: Date;
    checkInIpAddress?: string;
    checkInLatitude?: number;
    checkInLongitude?: number;
    checkOutIpAddress?: string;
    checkOutLatitude?: number;
    checkOutLongitude?: number;
    workingHours?: number;
    overtimeHours?: number;
    status: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'OnLeave' | 'Holiday' | 'Weekend';
    remarks?: string;
    approvedBy?: bigint;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    deletedAt?: Date;
}
interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'uuid'> {
}
export declare class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    shiftId?: bigint;
    attendanceDate: Date;
    checkInTime?: Date;
    checkOutTime?: Date;
    checkInIpAddress?: string;
    checkInLatitude?: number;
    checkInLongitude?: number;
    checkOutIpAddress?: string;
    checkOutLatitude?: number;
    checkOutLongitude?: number;
    workingHours?: number;
    overtimeHours?: number;
    status: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'OnLeave' | 'Holiday' | 'Weekend';
    remarks?: string;
    approvedBy?: bigint;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Attendance;
    calculateWorkingHours(shiftHours: number): number;
    isLate(shiftStartTime: Date): boolean;
}
export {};
//# sourceMappingURL=Attendance.model.d.ts.map