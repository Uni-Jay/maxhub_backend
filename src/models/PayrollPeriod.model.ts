import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface PayrollPeriodCreationAttributes extends Optional<PayrollPeriodAttributes, 'id' | 'uuid'> {}

export class PayrollPeriod extends Model<PayrollPeriodAttributes, PayrollPeriodCreationAttributes>
  implements PayrollPeriodAttributes {
  public id!: bigint;
  public uuid!: string;
  public periodCode!: string;
  public month!: number;
  public year!: number;
  public startDate!: Date;
  public endDate!: Date;
  public salaryProcessDate!: Date;
  public bankTransferDate?: Date;
  public status!: 'Draft' | 'Processing' | 'Processed' | 'Approved' | 'Transferred' | 'Closed';
  public processedBy?: bigint;
  public approvedBy?: bigint;
  public approvalDate?: Date;
  public remarks?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof PayrollPeriod {
    PayrollPeriod.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        uuid: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          unique: true,
          allowNull: false,
        },
        periodCode: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
          comment: 'Payroll period code (YYYY-MM)',
        },
        month: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          validate: { min: 1, max: 12 },
          comment: 'Month number (1-12)',
        },
        year: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          comment: 'Year',
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Payroll period start date',
        },
        endDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Payroll period end date',
        },
        salaryProcessDate: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Salary processing date',
        },
        bankTransferDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Date of bank transfer',
        },
        status: {
          type: DataTypes.ENUM('Draft', 'Processing', 'Processed', 'Approved', 'Transferred', 'Closed'),
          defaultValue: 'Draft',
          allowNull: false,
          comment: 'Payroll status',
        },
        processedBy: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'User who processed payroll',
        },
        approvedBy: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'User who approved payroll',
        },
        approvalDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Payroll approval date',
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Payroll remarks',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'payroll_periods',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          { fields: ['periodCode'], name: 'idx_payroll_periods_periodCode' },
          { fields: ['month', 'year'], name: 'idx_payroll_periods_month_year' },
          { fields: ['status'], name: 'idx_payroll_periods_status' },
          { fields: ['uuid'], name: 'idx_payroll_periods_uuid' },
        ],
        comment: 'Payroll periods and cycles',
      }
    );
    return PayrollPeriod;
  }

  public canProcess(): boolean {
    return this.status === 'Draft';
  }

  public canApprove(): boolean {
    return this.status === 'Processed';
  }
}
