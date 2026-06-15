import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AttendanceLogAttributes {
  id: bigint;
  uuid: string;
  attendanceId: bigint;
  action: 'CheckIn' | 'CheckOut' | 'Modified' | 'Approved' | 'Rejected' | 'Cancelled';
  performedBy: bigint;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
  userAgent?: string;
  deletedAt?: Date;
}

interface AttendanceLogCreationAttributes extends Optional<AttendanceLogAttributes, 'id' | 'uuid'> {}

export class AttendanceLog extends Model<AttendanceLogAttributes, AttendanceLogCreationAttributes>
  implements AttendanceLogAttributes {
  public id!: bigint;
  public uuid!: string;
  public attendanceId!: bigint;
  public action!: 'CheckIn' | 'CheckOut' | 'Modified' | 'Approved' | 'Rejected' | 'Cancelled';
  public performedBy!: bigint;
  public oldValues?: object;
  public newValues?: object;
  public ipAddress?: string;
  public userAgent?: string;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AttendanceLog {
    AttendanceLog.init(
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
        attendanceId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to attendance table',
        },
        action: {
          type: DataTypes.ENUM('CheckIn', 'CheckOut', 'Modified', 'Approved', 'Rejected', 'Cancelled'),
          allowNull: false,
          comment: 'Type of action performed',
        },
        performedBy: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'User who performed the action',
        },
        oldValues: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Previous values for modifications',
        },
        newValues: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'New values for modifications',
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
          comment: 'IP address from which action was performed',
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Client user agent string',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'attendance_logs',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['attendanceId'],
            name: 'idx_attendance_logs_attendanceId',
          },
          {
            fields: ['performedBy'],
            name: 'idx_attendance_logs_performedBy',
          },
          {
            fields: ['action'],
            name: 'idx_attendance_logs_action',
          },
          {
            fields: ['createdAt'],
            name: 'idx_attendance_logs_createdAt',
          },
          {
            fields: ['uuid'],
            name: 'idx_attendance_logs_uuid',
          },
        ],
        comment: 'Audit trail for attendance modifications',
      }
    );

    return AttendanceLog;
  }
}