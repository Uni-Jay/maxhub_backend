import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AttendanceAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  shiftId?: bigint;
  attendanceDate: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInIpAddress?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutIpAddress?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  workingHours?: number;
  overtimeHours?: number;
  status: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'OnLeave' | 'Holiday' | 'Weekend';
  remarks?: string;
  approvedBy?: bigint;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  deletedAt?: Date;
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'uuid'> {}

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public shiftId?: bigint;
  public attendanceDate!: Date;
  public checkInTime?: Date;
  public checkOutTime?: Date;
  public checkInIpAddress?: string;
  public checkInLatitude?: number;
  public checkInLongitude?: number;
  public checkOutIpAddress?: string;
  public checkOutLatitude?: number;
  public checkOutLongitude?: number;
  public workingHours?: number;
  public overtimeHours?: number;
  public status!: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'OnLeave' | 'Holiday' | 'Weekend';
  public remarks?: string;
  public approvedBy?: bigint;
  public approvalStatus!: 'Pending' | 'Approved' | 'Rejected';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Attendance {
    Attendance.init(
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
        shiftId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to shifts table',
        },
        attendanceDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Date of attendance',
        },
        checkInTime: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Check-in timestamp',
        },
        checkOutTime: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Check-out timestamp',
        },
        checkInIpAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
          comment: 'IP address of check-in',
        },
        checkInLatitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
          comment: 'GPS latitude of check-in location',
        },
        checkInLongitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
          comment: 'GPS longitude of check-in location',
        },
        checkOutIpAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
          comment: 'IP address of check-out',
        },
        checkOutLatitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
          comment: 'GPS latitude of check-out location',
        },
        checkOutLongitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
          comment: 'GPS longitude of check-out location',
        },
        workingHours: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Hours worked (calculated)',
        },
        overtimeHours: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Overtime hours (calculated)',
        },
        status: {
          type: DataTypes.ENUM('Present', 'Absent', 'Late', 'HalfDay', 'OnLeave', 'Holiday', 'Weekend'),
          defaultValue: 'Absent',
          allowNull: false,
          comment: 'Attendance status',
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Admin notes or reasons for status',
        },
        approvedBy: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Manager who approved the attendance',
        },
        approvalStatus: {
          type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
          defaultValue: 'Pending',
          allowNull: false,
          comment: 'Manager approval status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'attendance',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['staffId'],
            name: 'idx_attendance_staffId',
          },
          {
            fields: ['attendanceDate'],
            name: 'idx_attendance_attendanceDate',
          },
          {
            fields: ['staffId', 'attendanceDate'],
            unique: true,
            name: 'idx_attendance_staffId_attendanceDate_unique',
          },
          {
            fields: ['status'],
            name: 'idx_attendance_status',
          },
          {
            fields: ['approvalStatus'],
            name: 'idx_attendance_approvalStatus',
          },
          {
            fields: ['uuid'],
            name: 'idx_attendance_uuid',
          },
        ],
        comment: 'Daily attendance tracking with GPS geolocation',
      }
    );

    return Attendance;
  }

  // Helper to calculate working hours
  public calculateWorkingHours(shiftHours: number): number {
    if (!this.checkInTime || !this.checkOutTime) return 0;
    const minutes = (this.checkOutTime.getTime() - this.checkInTime.getTime()) / (1000 * 60);
    return minutes / 60;
  }

  // Helper to check if attendance is late
  public isLate(shiftStartTime: Date): boolean {
    if (!this.checkInTime) return true;
    return this.checkInTime > shiftStartTime;
  }
}