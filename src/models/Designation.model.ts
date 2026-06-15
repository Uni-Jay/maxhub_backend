import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface DesignationAttributes {
  id: bigint;
  uuid: string;
  code: string;
  name: string;
  description?: string;
  departmentId?: bigint;
  level: number;
  baseSalary?: number;
  status: 'Active' | 'Inactive';
  deletedAt?: Date;
}

interface DesignationCreationAttributes extends Optional<DesignationAttributes, 'id' | 'uuid'> {}

export class Designation extends Model<DesignationAttributes, DesignationCreationAttributes>
  implements DesignationAttributes {
  public id!: bigint;
  public uuid!: string;
  public code!: string;
  public name!: string;
  public description?: string;
  public departmentId?: bigint;
  public level!: number;
  public baseSalary?: number;
  public status!: 'Active' | 'Inactive';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Designation {
    Designation.init(
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
          type: DataTypes.STRING(100),
          unique: true,
          allowNull: false,
          comment: 'Designation code (CEO, CFO, MANAGER, etc.)',
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Job designation/title',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Designation responsibilities and requirements',
        },
        departmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to departments table (optional for company-wide roles)',
        },
        level: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 1,
          allowNull: false,
          comment: 'Designation level (1=Junior, 2=Mid, 3=Senior, 4=Lead, 5=Manager, etc.)',
        },
        baseSalary: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Base salary for designation',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Designation availability status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'designations',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['code'],
            name: 'idx_designations_code',
          },
          {
            fields: ['departmentId'],
            name: 'idx_designations_departmentId',
          },
          {
            fields: ['level'],
            name: 'idx_designations_level',
          },
          {
            fields: ['status'],
            name: 'idx_designations_status',
          },
          {
            fields: ['uuid'],
            name: 'idx_designations_uuid',
          },
        ],
        comment: 'Job designations/titles with hierarchy levels',
      }
    );

    return Designation;
  }
}