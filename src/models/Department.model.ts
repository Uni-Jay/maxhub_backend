import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface DepartmentAttributes {
  id: bigint;
  uuid: string;
  code: string;
  name: string;
  description?: string;
  parentDepartmentId?: bigint;
  headUserId?: bigint;
  budget?: number;
  status: 'Active' | 'Inactive' | 'Archived';
  deletedAt?: Date;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'uuid'> {}

export class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes {
  public id!: bigint;
  public uuid!: string;
  public code!: string;
  public name!: string;
  public description?: string;
  public parentDepartmentId?: bigint;
  public headUserId?: bigint;
  public budget?: number;
  public status!: 'Active' | 'Inactive' | 'Archived';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Department {
    Department.init(
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
          comment: 'Department code (HR, FINANCE, SALES, etc.)',
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Department name',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Department purpose and responsibilities',
        },
        parentDepartmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Parent department for hierarchical structure',
        },
        headUserId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to users table for department head',
        },
        budget: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Annual department budget',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'Archived'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Department operational status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'departments',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['code'],
            name: 'idx_departments_code',
          },
          {
            fields: ['parentDepartmentId'],
            name: 'idx_departments_parentDepartmentId',
          },
          {
            fields: ['headUserId'],
            name: 'idx_departments_headUserId',
          },
          {
            fields: ['status'],
            name: 'idx_departments_status',
          },
          {
            fields: ['uuid'],
            name: 'idx_departments_uuid',
          },
        ],
        comment: 'Organizational departments with hierarchical support',
      }
    );

    return Department;
  }
}