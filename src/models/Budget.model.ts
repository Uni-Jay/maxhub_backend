import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface BudgetCreationAttributes extends Optional<BudgetAttributes, 'id' | 'uuid'> {}

export class Budget extends Model<BudgetAttributes, BudgetCreationAttributes>
  implements BudgetAttributes {
  public id!: bigint;
  public uuid!: string;
  public budgetCode!: string;
  public budgetName!: string;
  public departmentId?: bigint;
  public fiscalYear!: number;
  public startDate!: Date;
  public endDate!: Date;
  public amount!: number;
  public spent!: number;
  public reserved!: number;
  public status!: 'Draft' | 'Approved' | 'Active' | 'Closed' | 'Cancelled';
  public description?: string;
  public approvedBy?: bigint;
  public approvedDate?: Date;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Budget {
    Budget.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        budgetCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Budget code' },
        budgetName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Budget name' },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Department ID' },
        fiscalYear: { type: DataTypes.INTEGER, allowNull: false, comment: 'Fiscal year' },
        startDate: { type: DataTypes.DATE, allowNull: false, comment: 'Start date' },
        endDate: { type: DataTypes.DATE, allowNull: false, comment: 'End date' },
        amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Budget amount' },
        spent: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Amount spent' },
        reserved: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Amount reserved' },
        status: { type: DataTypes.ENUM('Draft', 'Approved', 'Active', 'Closed', 'Cancelled'), defaultValue: 'Draft' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        approvedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Approved by user ID' },
        approvedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Approval date' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'budgets', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['budgetCode'], name: 'idx_budgets_budgetCode' },
          { fields: ['departmentId'], name: 'idx_budgets_departmentId' },
          { fields: ['fiscalYear'], name: 'idx_budgets_fiscalYear' },
          { fields: ['status'], name: 'idx_budgets_status' },
          { fields: ['uuid'], name: 'idx_budgets_uuid' },
        ],
        comment: 'Budgets'
      }
    );
    return Budget;
  }
}
