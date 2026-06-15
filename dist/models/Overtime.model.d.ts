import { Model, Optional, Sequelize } from 'sequelize';
interface OvertimeAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    attendanceId: bigint;
    date: Date;
    startTime: Date;
    endTime: Date;
    overtimeHours: number;
    overtimeRate: number;
    amount?: number;
    reason?: string;
    approvedBy?: bigint;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface OvertimeCreationAttributes extends Optional<OvertimeAttributes, 'id' | 'uuid'> {
}
export declare class Overtime extends Model<OvertimeAttributes, OvertimeCreationAttributes> implements OvertimeAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    attendanceId: bigint;
    date: Date;
    startTime: Date;
    endTime: Date;
    overtimeHours: number;
    overtimeRate: number;
    amount?: number;
    reason?: string;
    approvedBy?: bigint;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof Overtime;
}
export {};
//# sourceMappingURL=Overtime.model.d.ts.map