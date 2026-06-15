import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface ChartOfAccountsCreationAttributes extends Optional<ChartOfAccountsAttributes, 'id' | 'uuid'> {}

export class ChartOfAccounts extends Model<ChartOfAccountsAttributes, ChartOfAccountsCreationAttributes>
  implements ChartOfAccountsAttributes {
  public id!: bigint;
  public uuid!: string;
  public accountCode!: string;
  public accountName!: string;
  public accountType!: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'CostOfGoodsSold';
  public subType?: string;
  public parentAccountId?: bigint;
  public description?: string;
  public isActive!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof ChartOfAccounts {
    ChartOfAccounts.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        accountCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Account code' },
        accountName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Account name' },
        accountType: { type: DataTypes.ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'CostOfGoodsSold'), allowNull: false },
        subType: { type: DataTypes.STRING(100), allowNull: true, comment: 'Sub-type' },
        parentAccountId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Parent account ID' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'chart_of_accounts', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['accountCode'], name: 'idx_chart_of_accounts_accountCode' },
          { fields: ['accountType'], name: 'idx_chart_of_accounts_accountType' },
          { fields: ['parentAccountId'], name: 'idx_chart_of_accounts_parentAccountId' },
          { fields: ['isActive'], name: 'idx_chart_of_accounts_isActive' },
          { fields: ['uuid'], name: 'idx_chart_of_accounts_uuid' },
        ],
        comment: 'Chart of accounts for accounting'
      }
    );
    return ChartOfAccounts;
  }
}
