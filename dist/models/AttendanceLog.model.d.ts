import { Model, Optional, Sequelize } from 'sequelize';
interface AttendanceLogAttributes {
    id: bigint;
    uuid: string;
    attendanceId: bigint;
    action: 'CheckIn' | 'CheckOut' | 'Modified' | 'Approved' | 'Rejected' | 'Cancelled';
    performedBy: bigint;
    oldValues?: object;
    newValues?: object;
    ipAddress?: string;
    userAgent?: string;
    deletedAt?: Date;
}
interface AttendanceLogCreationAttributes extends Optional<AttendanceLogAttributes, 'id' | 'uuid'> {
}
export declare class AttendanceLog extends Model<AttendanceLogAttributes, AttendanceLogCreationAttributes> implements AttendanceLogAttributes {
    id: bigint;
    uuid: string;
    attendanceId: bigint;
    action: 'CheckIn' | 'CheckOut' | 'Modified' | 'Approved' | 'Rejected' | 'Cancelled';
    performedBy: bigint;
    oldValues?: object;
    newValues?: object;
    ipAddress?: string;
    userAgent?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof AttendanceLog;
}
export {};
//# sourceMappingURL=AttendanceLog.model.d.ts.map