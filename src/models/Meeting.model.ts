import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface MeetingAttributes {
  id: bigint;
  uuid: string;
  meetingCode: string;
  title: string;
  description?: string;
  meetingType: 'Group' | 'Department' | 'Classroom' | 'Interview' | 'Training';
  roomName: string;
  meetingLink: string;
  hostUserId: bigint;
  scheduledAt?: Date;
  durationMinutes?: number;
  status: 'Scheduled' | 'Live' | 'Ended' | 'Cancelled';
  maxParticipants?: number;
  isRecurring?: boolean;
  recordingUrl?: string;
  cloudinaryPublicId?: string;
  deletedAt?: Date;
}

interface MeetingCreationAttributes extends Optional<MeetingAttributes, 'id' | 'uuid'> {}

export class Meeting extends Model<MeetingAttributes, MeetingCreationAttributes>
  implements MeetingAttributes {
  public id!: bigint;
  public uuid!: string;
  public meetingCode!: string;
  public title!: string;
  public description?: string;
  public meetingType!: 'Group' | 'Department' | 'Classroom' | 'Interview' | 'Training';
  public roomName!: string;
  public meetingLink!: string;
  public hostUserId!: bigint;
  public scheduledAt?: Date;
  public durationMinutes?: number;
  public status!: 'Scheduled' | 'Live' | 'Ended' | 'Cancelled';
  public maxParticipants?: number;
  public isRecurring?: boolean;
  public recordingUrl?: string;
  public cloudinaryPublicId?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Meeting {
    Meeting.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        meetingCode: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        title: { type: DataTypes.STRING(200), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        meetingType: {
          type: DataTypes.ENUM('Group', 'Department', 'Classroom', 'Interview', 'Training'),
          allowNull: false, defaultValue: 'Group',
        },
        roomName: { type: DataTypes.STRING(300), allowNull: false },
        meetingLink: { type: DataTypes.STRING(500), allowNull: false, comment: 'Google Meet URL — provided by the host when scheduling' },
        hostUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        scheduledAt: { type: DataTypes.DATE, allowNull: true },
        durationMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 60 },
        status: {
          type: DataTypes.ENUM('Scheduled', 'Live', 'Ended', 'Cancelled'),
          allowNull: false, defaultValue: 'Scheduled',
        },
        maxParticipants: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true },
        recordingUrl: { type: DataTypes.TEXT, allowNull: true },
        cloudinaryPublicId: { type: DataTypes.STRING(300), allowNull: true },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize, tableName: 'meetings', timestamps: true, paranoid: true,
        underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['meetingCode'], name: 'idx_meetings_code' },
          { fields: ['hostUserId'], name: 'idx_meetings_host' },
          { fields: ['status'], name: 'idx_meetings_status' },
          { fields: ['scheduledAt'], name: 'idx_meetings_scheduled_at' },
          { fields: ['uuid'], name: 'idx_meetings_uuid' },
        ],
      }
    );
    return Meeting;
  }
}
