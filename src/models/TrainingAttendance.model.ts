import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface TrainingAttendanceAttributes {
  id: bigint;
  uuid: string;
  trainingProgramId: bigint;
  staffId: bigint;
  attendanceDate: Date;
  status: 'Attended' | 'Absent' | 'ExcusedAbsent' | 'LateArrival' | 'EarlyLeaving';
  arrivalTime?: Date;
  departureTime?: Date;
  feedbackRating?: number;
  feedbackComments?: string;
  certificateIssued: boolean;
  deletedAt?: Date;
}

interface TrainingAttendanceCreationAttributes extends Optional<TrainingAttendanceAttributes, 'id' | 'uuid'> {}

export class TrainingAttendance extends Model<TrainingAttendanceAttributes, TrainingAttendanceCreationAttributes>
  implements TrainingAttendanceAttributes {
  public id!: bigint;
  public uuid!: string;
  public trainingProgramId!: bigint;
  public staffId!: bigint;
  public attendanceDate!: Date;
  public status!: 'Attended' | 'Absent' | 'ExcusedAbsent' | 'LateArrival' | 'EarlyLeaving';
  public arrivalTime?: Date;
  public departureTime?: Date;
  public feedbackRating?: number;
  public feedbackComments?: string;
  public certificateIssued!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof TrainingAttendance {
    TrainingAttendance.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        trainingProgramId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Training program ID' },
        staffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
        attendanceDate: { type: DataTypes.DATE, allowNull: false, comment: 'Attendance date' },
        status: { type: DataTypes.ENUM('Attended', 'Absent', 'ExcusedAbsent', 'LateArrival', 'EarlyLeaving'), allowNull: false },
        arrivalTime: { type: DataTypes.DATE, allowNull: true, comment: 'Arrival time' },
        departureTime: { type: DataTypes.DATE, allowNull: true, comment: 'Departure time' },
        feedbackRating: { type: DataTypes.DECIMAL(3, 2), allowNull: true, comment: 'Rating 1-5' },
        feedbackComments: { type: DataTypes.TEXT, allowNull: true, comment: 'Feedback comments' },
        certificateIssued: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Certificate issued' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'training_attendances', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['trainingProgramId'], name: 'idx_training_attendances_trainingProgramId' },
          { fields: ['staffId'], name: 'idx_training_attendances_staffId' },
          { fields: ['attendanceDate'], name: 'idx_training_attendances_attendanceDate' },
          { fields: ['status'], name: 'idx_training_attendances_status' },
          { fields: ['uuid'], name: 'idx_training_attendances_uuid' },
        ],
        comment: 'Training attendance records'
      }
    );
    return TrainingAttendance;
  }
}
