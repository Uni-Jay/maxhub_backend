import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface EmployeeSalaryAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  payrollPeriodId: bigint;
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  incomeTax?: number;
  providentFund?: number;
  healthInsurance?: number;
  otherDeductions?: number;
  advanceAmount?: number;
  bonus?: number;
  status: 'Draft' | 'Approved' | 'Processed' | 'Paid' | 'OnHold';
  processedOn?: Date;
  paidOn?: Date;
  bankAccountNumber?: string;
  remarks?: string;
  deletedAt?: Date;
}

interface EmployeeSalaryCreationAttributes extends Optional<EmployeeSalaryAttributes, 'id' | 'uuid'> {}

export class EmployeeSalary extends Model<EmployeeSalaryAttributes, EmployeeSalaryCreationAttributes>
  implements EmployeeSalaryAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public payrollPeriodId!: bigint;
  public baseSalary!: number;
  public grossSalary!: number;
  public netSalary!: number;
  public totalEarnings!: number;
  public totalDeductions!: number;
  public incomeTax?: number;
  public providentFund?: number;
  public healthInsurance?: number;
  public otherDeductions?: number;
  public advanceAmount?: number;
  public bonus?: number;
  public status!: 'Draft' | 'Approved' | 'Processed' | 'Paid' | 'OnHold';
  public processedOn?: Date;
  public paidOn?: Date;
  public bankAccountNumber?: string;
  public remarks?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof EmployeeSalary {
    EmployeeSalary.init(
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
        staffId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to staff table',
        },
        payrollPeriodId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to payroll_periods table',
        },
        baseSalary: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Base salary',
        },
        grossSalary: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Total gross salary',
        },
        netSalary: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Net salary after deductions',
        },
        totalEarnings: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Total earnings',
        },
        totalDeductions: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Total deductions',
        },
        incomeTax: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Income tax deduction',
        },
        providentFund: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Provident fund contribution',
        },
        healthInsurance: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Health insurance premium',
        },
        otherDeductions: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Other deductions',
        },
        advanceAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Salary advance taken',
        },
        bonus: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Bonus amount',
        },
        status: {
          type: DataTypes.ENUM('Draft', 'Approved', 'Processed', 'Paid', 'OnHold'),
          defaultValue: 'Draft',
          allowNull: false,
          comment: 'Salary status',
        },
        processedOn: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Date salary was processed',
        },
        paidOn: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Date salary was paid',
        },
        bankAccountNumber: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: 'Bank account for transfer',
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Salary remarks',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'employee_salaries',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          { fields: ['staffId'], name: 'idx_employee_salaries_staffId' },
          { fields: ['payrollPeriodId'], name: 'idx_employee_salaries_payrollPeriodId' },
          { fields: ['status'], name: 'idx_employee_salaries_status' },
          { fields: ['staffId', 'payrollPeriodId'], name: 'idx_employee_salaries_staffId_payrollPeriodId' },
          { fields: ['uuid'], name: 'idx_employee_salaries_uuid' },
        ],
        comment: 'Employee salary records',
      }
    );
    return EmployeeSalary;
  }

  public calculateDeductions(): number {
    let total = 0;
    if (this.incomeTax) total += Number(this.incomeTax);
    if (this.providentFund) total += Number(this.providentFund);
    if (this.healthInsurance) total += Number(this.healthInsurance);
    if (this.otherDeductions) total += Number(this.otherDeductions);
    if (this.advanceAmount) total += Number(this.advanceAmount);
    return total;
  }

  public calculateNetSalary(): number {
    return Number(this.grossSalary) - this.calculateDeductions();
  }
}
