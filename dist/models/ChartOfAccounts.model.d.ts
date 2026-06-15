import { Model, Optional, Sequelize } from 'sequelize';
interface ChartOfAccountsAttributes {
    id: bigint;
    uuid: string;
    accountCode: string;
    accountName: string;
    accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'CostOfGoodsSold';
    subType?: string;
    parentAccountId?: bigint;
    description?: string;
    isActive: boolean;
    deletedAt?: Date;
}
interface ChartOfAccountsCreationAttributes extends Optional<ChartOfAccountsAttributes, 'id' | 'uuid'> {
}
export declare class ChartOfAccounts extends Model<ChartOfAccountsAttributes, ChartOfAccountsCreationAttributes> implements ChartOfAccountsAttributes {
    id: bigint;
    uuid: string;
    accountCode: string;
    accountName: string;
    accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'CostOfGoodsSold';
    subType?: string;
    parentAccountId?: bigint;
    description?: string;
    isActive: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof ChartOfAccounts;
}
export {};
//# sourceMappingURL=ChartOfAccounts.model.d.ts.map