import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id' | 'uuid'> {}

export class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes>
  implements ExpenseAttributes {
  public id!: bigint;
  public uuid!: string;
  public expenseCode!: string;
  public staffId!: bigint;
  public expenseDate!: Date;
  public category!: string;
  public amount!: number;
  public currency!: string;
  public description?: string;
  public receiptUrl?: string;
  public status!: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Reimbursed';
  public submittedDate?: Date;
  public approvedBy?: bigint;
  public approvedDate?: Date;
  public reimbursedDate?: Date;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Expense {
    Expense.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        expenseCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Expense code' },
        staffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
        expenseDate: { type: DataTypes.DATE, allowNull: false, comment: 'Expense date' },
        category: { type: DataTypes.STRING(100), allowNull: false, comment: 'Category' },
        amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, comment: 'Amount' },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        receiptUrl: { type: DataTypes.TEXT, allowNull: true, comment: 'Receipt URL/path' },
        status: { type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected', 'Reimbursed'), defaultValue: 'Draft' },
        submittedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Submission date' },
        approvedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Approved by user ID' },
        approvedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Approval date' },
        reimbursedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Reimbursement date' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'expenses', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['expenseCode'], name: 'idx_expenses_expenseCode' },
          { fields: ['staffId'], name: 'idx_expenses_staffId' },
          { fields: ['category'], name: 'idx_expenses_category' },
          { fields: ['status'], name: 'idx_expenses_status' },
          { fields: ['expenseDate'], name: 'idx_expenses_expenseDate' },
          { fields: ['uuid'], name: 'idx_expenses_uuid' },
        ],
        comment: 'Employee expenses and claims'
      }
    );
    return Expense;
  }
}
