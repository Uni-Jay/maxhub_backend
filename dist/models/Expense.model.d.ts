import { Model, Optional, Sequelize } from 'sequelize';
interface ExpenseAttributes {
    id: bigint;
    uuid: string;
    expenseCode: string;
    staffId: bigint;
    expenseDate: Date;
    category: string;
    amount: number;
    currency: string;
    description?: string;
    receiptUrl?: string;
    status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Reimbursed';
    submittedDate?: Date;
    approvedBy?: bigint;
    approvedDate?: Date;
    reimbursedDate?: Date;
    createdById: bigint;
    deletedAt?: Date;
}
interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id' | 'uuid'> {
}
export declare class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
    id: bigint;
    uuid: string;
    expenseCode: string;
    staffId: bigint;
    expenseDate: Date;
    category: string;
    amount: number;
    currency: string;
    description?: string;
    receiptUrl?: string;
    status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Reimbursed';
    submittedDate?: Date;
    approvedBy?: bigint;
    approvedDate?: Date;
    reimbursedDate?: Date;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Expense;
}
export {};
//# sourceMappingURL=Expense.model.d.ts.map