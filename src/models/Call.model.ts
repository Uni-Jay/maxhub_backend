import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface CallAttributes {
  id: bigint;
  uuid: string;
  callerUserId: bigint;
  calleeUserId: bigint;
  callType: 'Video' | 'Voice';
  status: 'Ringing' | 'Active' | 'Ended' | 'Missed' | 'Declined';
  roomName: string;
  conversationId?: bigint;
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
}

interface CallCreationAttributes extends Optional<CallAttributes, 'id' | 'uuid'> {}

export class Call extends Model<CallAttributes, CallCreationAttributes>
  implements CallAttributes {
  public id!: bigint;
  public uuid!: string;
  public callerUserId!: bigint;
  public calleeUserId!: bigint;
  public callType!: 'Video' | 'Voice';
  public status!: 'Ringing' | 'Active' | 'Ended' | 'Missed' | 'Declined';
  public roomName!: string;
  public conversationId?: bigint;
  public startedAt?: Date;
  public endedAt?: Date;
  public durationSeconds?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Call {
    Call.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        callerUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        calleeUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        callType: { type: DataTypes.ENUM('Video', 'Voice'), allowNull: false, defaultValue: 'Video' },
        status: {
          type: DataTypes.ENUM('Ringing', 'Active', 'Ended', 'Missed', 'Declined'),
          allowNull: false, defaultValue: 'Ringing',
        },
        roomName: { type: DataTypes.STRING(300), allowNull: false },
        conversationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        startedAt: { type: DataTypes.DATE, allowNull: true },
        endedAt: { type: DataTypes.DATE, allowNull: true },
        durationSeconds: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      },
      {
        sequelize, tableName: 'calls', timestamps: true,
        underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['callerUserId'], name: 'idx_calls_caller' },
          { fields: ['calleeUserId'], name: 'idx_calls_callee' },
          { fields: ['status'], name: 'idx_calls_status' },
          { fields: ['uuid'], name: 'idx_calls_uuid' },
          { fields: ['createdAt'], name: 'idx_calls_created_at' },
        ],
      }
    );
    return Call;
  }
}
