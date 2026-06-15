import { Model, Optional, Sequelize } from 'sequelize';
interface EmployeePromotionAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    fromDesignationId: bigint;
    toDesignationId: bigint;
    fromDepartmentId?: bigint;
    toDepartmentId?: bigint;
    promotionDate: Date;
    effectiveDate: Date;
    reason?: string;
    promotedBy: bigint;
    salaryIncreasePercentage?: number;
    newSalary?: number;
    status: 'Proposed' | 'Approved' | 'Rejected' | 'Effective' | 'Completed';
    approvalDate?: Date;
    approvalRemarks?: string;
    rejectionReason?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface EmployeePromotionCreationAttributes extends Optional<EmployeePromotionAttributes, 'id' | 'uuid'> {
}
export declare class EmployeePromotion extends Model<EmployeePromotionAttributes, EmployeePromotionCreationAttributes> implements EmployeePromotionAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    fromDesignationId: bigint;
    toDesignationId: bigint;
    fromDepartmentId?: bigint;
    toDepartmentId?: bigint;
    promotionDate: Date;
    effectiveDate: Date;
    reason?: string;
    promotedBy: bigint;
    salaryIncreasePercentage?: number;
    newSalary?: number;
    status: 'Proposed' | 'Approved' | 'Rejected' | 'Effective' | 'Completed';
    approvalDate?: Date;
    approvalRemarks?: string;
    rejectionReason?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof EmployeePromotion;
}
export {};
//# sourceMappingURL=EmployeePromotion.model.d.ts.map