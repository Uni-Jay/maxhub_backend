import { Model, Optional, Sequelize } from 'sequelize';
interface LeaveRequestAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    leaveTypeId: bigint;
    startDate: Date;
    endDate: Date;
    numberofDays: number;
    reason: string;
    documentUrl?: string;
    approverUserId?: bigint;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Withdrawn';
    approvalComments?: string;
    approvalDate?: Date;
    cancelledBy?: bigint;
    cancellationReason?: string;
    cancellationDate?: Date;
    deletedAt?: Date;
}
interface LeaveRequestCreationAttributes extends Optional<LeaveRequestAttributes, 'id' | 'uuid'> {
}
export declare class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes> implements LeaveRequestAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    leaveTypeId: bigint;
    startDate: Date;
    endDate: Date;
    numberofDays: number;
    reason: string;
    documentUrl?: string;
    approverUserId?: bigint;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Withdrawn';
    approvalComments?: string;
    approvalDate?: Date;
    cancelledBy?: bigint;
    cancellationReason?: string;
    cancellationDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof LeaveRequest;
    canBeCancelled(): boolean;
    canBeWithdrawn(): boolean;
    calculateDays(): number;
    isInPast(): boolean;
}
export {};
//# sourceMappingURL=LeaveRequest.model.d.ts.map