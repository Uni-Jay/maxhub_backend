import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface OvertimeAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  attendanceId: bigint;
  date: Date;
  startTime: Date;
  endTime: Date;
  overtimeHours: number;
  overtimeRate: number; // Multiplier e.g., 1.5x
  amount?: number;
  reason?: string;
  approvedBy?: bigint;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface OvertimeCreationAttributes extends Optional<OvertimeAttributes, 'id' | 'uuid'> {}

export class Overtime
  extends Model<OvertimeAttributes, OvertimeCreationAttributes>
  implements OvertimeAttributes
{
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public attendanceId!: bigint;
  public date!: Date;
  public startTime!: Date;
  public endTime!: Date;
  public overtimeHours!: number;
  public overtimeRate!: number;
  public amount?: number;
  public reason?: string;
  public approvedBy?: bigint;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof Overtime {
    Overtime.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: uuidv4,
        },
        staffId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        attendanceId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'attendance',
            key: 'id',
          },
        },
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        startTime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        endTime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        overtimeHours: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
        },
        overtimeRate: {
          type: DataTypes.DECIMAL(3, 2),
          allowNull: false,
          defaultValue: 1.5,
        },
        amount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
        },
        reason: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        approvedBy: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        status: {
          type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Paid'),
          allowNull: false,
          defaultValue: 'Pending',
        },
      },
      {
        sequelize,
        modelName: 'overtime',
        tableName: 'overtime',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['staffId'],
          },
          {
            fields: ['attendanceId'],
          },
          {
            fields: ['date'],
          },
          {
            fields: ['status'],
          },
        ],
      }
    );
    return Overtime;
  }
}
