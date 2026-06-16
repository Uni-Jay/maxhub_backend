import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'Holiday';

interface StudentAttendanceAttributes {
  id: bigint;
  uuid: string;
  studentId: bigint;
  courseId: bigint;
  classScheduleId?: bigint;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  minutesLate?: number;
  excuseReason?: string;
  notes?: string;
  markedById?: bigint;
  markedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentAttendanceCreationAttributes
  extends Optional<StudentAttendanceAttributes, 'id' | 'uuid' | 'status'> {}

export class StudentAttendance
  extends Model<StudentAttendanceAttributes, StudentAttendanceCreationAttributes>
  implements StudentAttendanceAttributes
{
  public id!: bigint;
  public uuid!: string;
  public studentId!: bigint;
  public courseId!: bigint;
  public classScheduleId?: bigint;
  public date!: string;
  public status!: AttendanceStatus;
  public checkInTime?: string;
  public checkOutTime?: string;
  public minutesLate?: number;
  public excuseReason?: string;
  public notes?: string;
  public markedById?: bigint;
  public markedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StudentAttendance {
    StudentAttendance.init(
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
          allowNull: false,
          unique: true,
        },
        studentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        classScheduleId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        date: { type: DataTypes.DATEONLY, allowNull: false },
        status: {
          type: DataTypes.ENUM('Present', 'Absent', 'Late', 'Excused', 'Holiday'),
          allowNull: false,
          defaultValue: 'Absent',
        },
        checkInTime: { type: DataTypes.TIME, allowNull: true },
        checkOutTime: { type: DataTypes.TIME, allowNull: true },
        minutesLate: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        excuseReason: { type: DataTypes.TEXT, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        markedById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        markedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        modelName: 'StudentAttendance',
        tableName: 'student_attendance',
        timestamps: true,
        indexes: [
          { fields: ['studentId'] },
          { fields: ['courseId'] },
          { fields: ['date'] },
          { fields: ['status'] },
          { unique: true, fields: ['studentId', 'courseId', 'date'] },
        ],
      }
    );
    return StudentAttendance;
  }
}

export default StudentAttendance;
