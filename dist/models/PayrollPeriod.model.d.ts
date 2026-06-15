import { Model, Optional, Sequelize } from 'sequelize';
interface PayrollPeriodAttributes {
    id: bigint;
    uuid: string;
    periodCode: string;
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
    salaryProcessDate: Date;
    bankTransferDate?: Date;
    status: 'Draft' | 'Processing' | 'Processed' | 'Approved' | 'Transferred' | 'Closed';
    processedBy?: bigint;
    approvedBy?: bigint;
    approvalDate?: Date;
    remarks?: string;
    deletedAt?: Date;
}
interface PayrollPeriodCreationAttributes extends Optional<PayrollPeriodAttributes, 'id' | 'uuid'> {
}
export declare class PayrollPeriod extends Model<PayrollPeriodAttributes, PayrollPeriodCreationAttributes> implements PayrollPeriodAttributes {
    id: bigint;
    uuid: string;
    periodCode: string;
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
    salaryProcessDate: Date;
    bankTransferDate?: Date;
    status: 'Draft' | 'Processing' | 'Processed' | 'Approved' | 'Transferred' | 'Closed';
    processedBy?: bigint;
    approvedBy?: bigint;
    approvalDate?: Date;
    remarks?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof PayrollPeriod;
    canProcess(): boolean;
    canApprove(): boolean;
}
export {};
//# sourceMappingURL=PayrollPeriod.model.d.ts.map