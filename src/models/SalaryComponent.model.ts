import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface SalaryComponentAttributes {
  id: bigint;
  uuid: string;
  componentCode: string;
  componentName: string;
  componentType: 'Earning' | 'Deduction' | 'Tax' | 'Loan';
  isActive: boolean;
  description?: string;
  deletedAt?: Date;
}

interface SalaryComponentCreationAttributes extends Optional<SalaryComponentAttributes, 'id' | 'uuid'> {}

export class SalaryComponent extends Model<SalaryComponentAttributes, SalaryComponentCreationAttributes>
  implements SalaryComponentAttributes {
  public id!: bigint;
  public uuid!: string;
  public componentCode!: string;
  public componentName!: string;
  public componentType!: 'Earning' | 'Deduction' | 'Tax' | 'Loan';
  public isActive!: boolean;
  public description?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof SalaryComponent {
    SalaryComponent.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        componentCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Component code' },
        componentName: { type: DataTypes.STRING(150), allowNull: false, comment: 'Component name' },
        componentType: { type: DataTypes.ENUM('Earning', 'Deduction', 'Tax', 'Loan'), allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'salary_components', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['componentCode'], name: 'idx_salary_components_componentCode' },
          { fields: ['componentType'], name: 'idx_salary_components_componentType' },
          { fields: ['isActive'], name: 'idx_salary_components_isActive' },
          { fields: ['uuid'], name: 'idx_salary_components_uuid' },
        ],
        comment: 'Salary components (earnings, deductions, taxes)'
      }
    );
    return SalaryComponent;
  }
}
