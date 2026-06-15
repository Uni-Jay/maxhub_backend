import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface InterviewAttributes {
  id: bigint;
  uuid: string;
  jobApplicationId: bigint;
  interviewType: 'Phone' | 'Video' | 'InPerson' | 'Group' | 'Technical' | 'HR';
  scheduledDate: Date;
  scheduledTime: string;
  interviewerUserId?: bigint;
  location?: string;
  meetingLink?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow' | 'Rescheduled';
  rating?: number;
  feedback?: string;
  completedDate?: Date;
  notes?: string;
  deletedAt?: Date;
}

interface InterviewCreationAttributes extends Optional<InterviewAttributes, 'id' | 'uuid'> {}

export class Interview extends Model<InterviewAttributes, InterviewCreationAttributes>
  implements InterviewAttributes {
  public id!: bigint;
  public uuid!: string;
  public jobApplicationId!: bigint;
  public interviewType!: 'Phone' | 'Video' | 'InPerson' | 'Group' | 'Technical' | 'HR';
  public scheduledDate!: Date;
  public scheduledTime!: string;
  public interviewerUserId?: bigint;
  public location?: string;
  public meetingLink?: string;
  public status!: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow' | 'Rescheduled';
  public rating?: number;
  public feedback?: string;
  public completedDate?: Date;
  public notes?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Interview {
    Interview.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        jobApplicationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job application ID' },
        interviewType: { type: DataTypes.ENUM('Phone', 'Video', 'InPerson', 'Group', 'Technical', 'HR'), allowNull: false },
        scheduledDate: { type: DataTypes.DATE, allowNull: false, comment: 'Interview date' },
        scheduledTime: { type: DataTypes.STRING(5), allowNull: false, comment: 'Time (HH:MM)' },
        interviewerUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Interviewer user ID' },
        location: { type: DataTypes.STRING(200), allowNull: true, comment: 'Location' },
        meetingLink: { type: DataTypes.TEXT, allowNull: true, comment: 'Video call link' },
        status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled', 'NoShow', 'Rescheduled'), defaultValue: 'Scheduled' },
        rating: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Rating 1-5' },
        feedback: { type: DataTypes.TEXT, allowNull: true, comment: 'Interviewer feedback' },
        completedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Completion date' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Internal notes' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'interviews', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['jobApplicationId'], name: 'idx_interviews_jobApplicationId' },
          { fields: ['interviewerUserId'], name: 'idx_interviews_interviewerUserId' },
          { fields: ['scheduledDate'], name: 'idx_interviews_scheduledDate' },
          { fields: ['status'], name: 'idx_interviews_status' },
          { fields: ['uuid'], name: 'idx_interviews_uuid' },
        ],
        comment: 'Job interviews'
      }
    );
    return Interview;
  }
}
