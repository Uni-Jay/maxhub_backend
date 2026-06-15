import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ShiftAttributes {
  id: bigint;
  uuid: string;
  code: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  workingHours: number;
  departmentId?: bigint;
  applicableForDays: string;
  isOvernight: boolean;
  status: 'Active' | 'Inactive';
  deletedAt?: Date;
}

interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'id' | 'uuid'> {}

export class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
  public id!: bigint;
  public uuid!: string;
  public code!: string;
  public name!: string;
  public description?: string;
  public startTime!: string;
  public endTime!: string;
  public breakDuration?: number;
  public workingHours!: number;
  public departmentId?: bigint;
  public applicableForDays!: string;
  public isOvernight!: boolean;
  public status!: 'Active' | 'Inactive';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Shift {
    Shift.init(
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
          comment: 'Shift identifier (MORNING, EVENING, etc.)',
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Shift name',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Shift details',
        },
        startTime: {
          type: DataTypes.STRING(8),
          allowNull: false,
          comment: 'Shift start time (HH:MM:SS)',
        },
        endTime: {
          type: DataTypes.STRING(8),
          allowNull: false,
          comment: 'Shift end time (HH:MM:SS)',
        },
        breakDuration: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          comment: 'Break duration in minutes',
        },
        workingHours: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Total working hours per shift',
        },
        departmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Department-specific shift (if null, applies to all)',
        },
        applicableForDays: {
          type: DataTypes.JSON,
          defaultValue: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          allowNull: false,
          comment: 'Days shift applies (JSON array)',
        },
        isOvernight: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether shift spans midnight',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Shift status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'shifts',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['code'],
            name: 'idx_shifts_code',
          },
          {
            fields: ['departmentId'],
            name: 'idx_shifts_departmentId',
          },
          {
            fields: ['status'],
            name: 'idx_shifts_status',
          },
          {
            fields: ['uuid'],
            name: 'idx_shifts_uuid',
          },
        ],
        comment: 'Work shifts with flexible scheduling',
      }
    );

    return Shift;
  }
}