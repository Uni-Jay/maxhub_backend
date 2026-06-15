import { Model, Optional, Sequelize } from 'sequelize';
interface ResignationAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    resignationDate: Date;
    lastWorkingDate?: Date;
    reasonForResignation: string;
    noticePeroidDays: number;
    status: 'Submitted' | 'Acknowledged' | 'Approved' | 'Rejected' | 'Completed';
    acknowledgmentDate?: Date;
    approvalDate?: Date;
    approvedBy?: bigint;
    rejectionReason?: string;
    exitInterviewDate?: Date;
    finalSettlementDate?: Date;
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface ResignationCreationAttributes extends Optional<ResignationAttributes, 'id' | 'uuid'> {
}
export declare class Resignation extends Model<ResignationAttributes, ResignationCreationAttributes> implements ResignationAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    resignationDate: Date;
    lastWorkingDate?: Date;
    reasonForResignation: string;
    noticePeroidDays: number;
    status: 'Submitted' | 'Acknowledged' | 'Approved' | 'Rejected' | 'Completed';
    acknowledgmentDate?: Date;
    approvalDate?: Date;
    approvedBy?: bigint;
    rejectionReason?: string;
    exitInterviewDate?: Date;
    finalSettlementDate?: Date;
    remarks?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof Resignation;
}
export {};
//# sourceMappingURL=Resignation.model.d.ts.map