import { Model, Optional, Sequelize } from 'sequelize';
interface LeaveTypeAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    categoryType: 'Paid' | 'Unpaid' | 'Compulsory';
    maxDaysPerYear: number;
    carryForwardDays?: number;
    requiresApproval: boolean;
    applicableToAll: boolean;
    applicableDepartments?: object;
    applicableDesignations?: object;
    attachmentRequired: boolean;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
}
interface LeaveTypeCreationAttributes extends Optional<LeaveTypeAttributes, 'id' | 'uuid'> {
}
export declare class LeaveType extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes> implements LeaveTypeAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    categoryType: 'Paid' | 'Unpaid' | 'Compulsory';
    maxDaysPerYear: number;
    carryForwardDays?: number;
    requiresApproval: boolean;
    applicableToAll: boolean;
    applicableDepartments?: object;
    applicableDesignations?: object;
    attachmentRequired: boolean;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof LeaveType;
}
export {};
//# sourceMappingURL=LeaveType.model.d.ts.map