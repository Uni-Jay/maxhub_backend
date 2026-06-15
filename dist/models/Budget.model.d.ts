import { Model, Optional, Sequelize } from 'sequelize';
interface BudgetAttributes {
    id: bigint;
    uuid: string;
    budgetCode: string;
    budgetName: string;
    departmentId?: bigint;
    fiscalYear: number;
    startDate: Date;
    endDate: Date;
    amount: number;
    spent: number;
    reserved: number;
    status: 'Draft' | 'Approved' | 'Active' | 'Closed' | 'Cancelled';
    description?: string;
    approvedBy?: bigint;
    approvedDate?: Date;
    createdById: bigint;
    deletedAt?: Date;
}
interface BudgetCreationAttributes extends Optional<BudgetAttributes, 'id' | 'uuid'> {
}
export declare class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
    id: bigint;
    uuid: string;
    budgetCode: string;
    budgetName: string;
    departmentId?: bigint;
    fiscalYear: number;
    startDate: Date;
    endDate: Date;
    amount: number;
    spent: number;
    reserved: number;
    status: 'Draft' | 'Approved' | 'Active' | 'Closed' | 'Cancelled';
    description?: string;
    approvedBy?: bigint;
    approvedDate?: Date;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Budget;
}
export {};
//# sourceMappingURL=Budget.model.d.ts.map