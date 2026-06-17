import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface MeetingParticipantAttributes {
  id: bigint;
  meetingId: bigint;
  userId: bigint;
  joinedAt?: Date;
  leftAt?: Date;
  durationSeconds?: number;
  status: 'Invited' | 'Joined' | 'Declined' | 'NoShow';
}

interface MeetingParticipantCreationAttributes extends Optional<MeetingParticipantAttributes, 'id'> {}

export class MeetingParticipant extends Model<MeetingParticipantAttributes, MeetingParticipantCreationAttributes>
  implements MeetingParticipantAttributes {
  public id!: bigint;
  public meetingId!: bigint;
  public userId!: bigint;
  public joinedAt?: Date;
  public leftAt?: Date;
  public durationSeconds?: number;
  public status!: 'Invited' | 'Joined' | 'Declined' | 'NoShow';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof MeetingParticipant {
    MeetingParticipant.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        meetingId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        joinedAt: { type: DataTypes.DATE, allowNull: true },
        leftAt: { type: DataTypes.DATE, allowNull: true },
        durationSeconds: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        status: {
          type: DataTypes.ENUM('Invited', 'Joined', 'Declined', 'NoShow'),
          allowNull: false, defaultValue: 'Invited',
        },
      },
      {
        sequelize, tableName: 'meeting_participants', timestamps: true,
        paranoid: false, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['meetingId'], name: 'idx_mp_meeting' },
          { fields: ['userId'], name: 'idx_mp_user' },
          { fields: ['meetingId', 'userId'], name: 'idx_mp_unique', unique: true },
        ],
      }
    );
    return MeetingParticipant;
  }
}
