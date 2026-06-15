import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface LeaveTypeAttributes {
  id: bigint;
  uuid: string;
  code: string;
  name: string;
  description?: string;
  categoryType: 'Paid' | 'Unpaid' | 'Compulsory';
  maxDaysPerYear: number;
  carryForwardDays?: number;
  requiresApproval: boolean;
  applicableToAll: boolean;
  applicableDepartments?: object;
  applicableDesignations?: object;
  attachmentRequired: boolean;
  status: 'Active' | 'Inactive';
  deletedAt?: Date;
}

interface LeaveTypeCreationAttributes extends Optional<LeaveTypeAttributes, 'id' | 'uuid'> {}

export class LeaveType extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes>
  implements LeaveTypeAttributes {
  public id!: bigint;
  public uuid!: string;
  public code!: string;
  public name!: string;
  public description?: string;
  public categoryType!: 'Paid' | 'Unpaid' | 'Compulsory';
  public maxDaysPerYear!: number;
  public carryForwardDays?: number;
  public requiresApproval!: boolean;
  public applicableToAll!: boolean;
  public applicableDepartments?: object;
  public applicableDesignations?: object;
  public attachmentRequired!: boolean;
  public status!: 'Active' | 'Inactive';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof LeaveType {
    LeaveType.init(
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
          comment: 'Leave type code (PL, SL, CL, etc.)',
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Leave type name',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Leave type details',
        },
        categoryType: {
          type: DataTypes.ENUM('Paid', 'Unpaid', 'Compulsory'),
          allowNull: false,
          comment: 'Leave payment category',
        },
        maxDaysPerYear: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          comment: 'Maximum days per calendar year',
        },
        carryForwardDays: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          comment: 'Carryover days to next year',
        },
        requiresApproval: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: 'Whether manager approval is required',
        },
        applicableToAll: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: 'Whether applicable to all staff',
        },
        applicableDepartments: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Departments for which leave is applicable',
        },
        applicableDesignations: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Designations for which leave is applicable',
        },
        attachmentRequired: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether medical certificate or proof is required',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Leave type status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'leave_types',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['code'],
            name: 'idx_leave_types_code',
          },
          {
            fields: ['categoryType'],
            name: 'idx_leave_types_categoryType',
          },
          {
            fields: ['status'],
            name: 'idx_leave_types_status',
          },
          {
            fields: ['uuid'],
            name: 'idx_leave_types_uuid',
          },
        ],
        comment: 'Leave type configurations',
      }
    );

    return LeaveType;
  }
}