import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface SalaryStructureAttributes {
  id: bigint;
  uuid: string;
  code: string;
  name: string;
  description?: string;
  departmentId?: bigint;
  designationId?: bigint;
  baseSalary: number;
  status: 'Active' | 'Inactive';
  applicableFromDate: Date;
  applicableToDate?: Date;
  deletedAt?: Date;
}

interface SalaryStructureCreationAttributes extends Optional<SalaryStructureAttributes, 'id' | 'uuid'> {}

export class SalaryStructure extends Model<SalaryStructureAttributes, SalaryStructureCreationAttributes>
  implements SalaryStructureAttributes {
  public id!: bigint;
  public uuid!: string;
  public code!: string;
  public name!: string;
  public description?: string;
  public departmentId?: bigint;
  public designationId?: bigint;
  public baseSalary!: number;
  public status!: 'Active' | 'Inactive';
  public applicableFromDate!: Date;
  public applicableToDate?: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof SalaryStructure {
    SalaryStructure.init(
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
        code: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
          comment: 'Salary structure code',
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
          comment: 'Salary structure name',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Structure details',
        },
        departmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to departments table',
        },
        designationId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to designations table',
        },
        baseSalary: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Base salary amount',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Salary structure status',
        },
        applicableFromDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Effective from date',
        },
        applicableToDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Effective until date',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'salary_structures',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          { fields: ['code'], name: 'idx_salary_structures_code' },
          { fields: ['departmentId'], name: 'idx_salary_structures_departmentId' },
          { fields: ['designationId'], name: 'idx_salary_structures_designationId' },
          { fields: ['status'], name: 'idx_salary_structures_status' },
          { fields: ['uuid'], name: 'idx_salary_structures_uuid' },
        ],
        comment: 'Salary structure definitions',
      }
    );
    return SalaryStructure;
  }

  public isActive(): boolean {
    const today = new Date();
    return this.status === 'Active' && 
           today >= this.applicableFromDate &&
           (!this.applicableToDate || today <= this.applicableToDate);
  }
}
