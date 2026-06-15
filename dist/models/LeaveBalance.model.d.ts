import { Model, Optional, Sequelize } from 'sequelize';
interface LeaveBalanceAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    leaveTypeId: bigint;
    year: number;
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    balanceDays: number;
    carryForwardDays?: number;
    lastUpdated: Date;
    deletedAt?: Date;
}
interface LeaveBalanceCreationAttributes extends Optional<LeaveBalanceAttributes, 'id' | 'uuid'> {
}
export declare class LeaveBalance extends Model<LeaveBalanceAttributes, LeaveBalanceCreationAttributes> implements LeaveBalanceAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    leaveTypeId: bigint;
    year: number;
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    balanceDays: number;
    carryForwardDays?: number;
    lastUpdated: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof LeaveBalance;
    getAvailableBalance(): number;
    updateBalance(approvedDays: number, pendingDays?: number): void;
}
export {};
//# sourceMappingURL=LeaveBalance.model.d.ts.map