import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface MessageReadAttributes {
  id: bigint;
  uuid: string;
  messageId: bigint;
  userId: bigint;
  readAt: Date;
  deletedAt?: Date;
}

interface MessageReadCreationAttributes extends Optional<MessageReadAttributes, 'id' | 'uuid'> {}

export class MessageRead extends Model<MessageReadAttributes, MessageReadCreationAttributes>
  implements MessageReadAttributes {
  public id!: bigint;
  public uuid!: string;
  public messageId!: bigint;
  public userId!: bigint;
  public readAt!: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof MessageRead {
    MessageRead.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        messageId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Message ID' },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'User ID who read' },
        readAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Read timestamp' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'message_reads', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['messageId'], name: 'idx_message_reads_messageId' },
          { fields: ['userId'], name: 'idx_message_reads_userId' },
          { fields: ['messageId', 'userId'], name: 'idx_message_reads_message_user' },
          { fields: ['uuid'], name: 'idx_message_reads_uuid' },
        ],
        comment: 'Message read receipts'
      }
    );
    return MessageRead;
  }
}
