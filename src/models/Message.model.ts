import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface MessageAttributes {
  id: bigint;
  uuid: string;
  conversationId: bigint;
  senderUserId: bigint;
  messageText: string;
  messageType: 'Text' | 'Image' | 'File' | 'Link' | 'Emoji' | 'Mention';
  attachmentUrl?: string;
  attachmentType?: string;
  replyToMessageId?: bigint;
  isEdited: boolean;
  editedAt?: Date;
  isPinned: boolean;
  reactions?: string;
  deletedAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'uuid'> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes {
  public id!: bigint;
  public uuid!: string;
  public conversationId!: bigint;
  public senderUserId!: bigint;
  public messageText!: string;
  public messageType!: 'Text' | 'Image' | 'File' | 'Link' | 'Emoji' | 'Mention';
  public attachmentUrl?: string;
  public attachmentType?: string;
  public replyToMessageId?: bigint;
  public isEdited!: boolean;
  public editedAt?: Date;
  public isPinned!: boolean;
  public reactions?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Message {
    Message.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        conversationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Conversation ID' },
        senderUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Sender user ID' },
        messageText: { type: DataTypes.TEXT, allowNull: false, comment: 'Message text' },
        messageType: { type: DataTypes.ENUM('Text', 'Image', 'File', 'Link', 'Emoji', 'Mention'), defaultValue: 'Text' },
        attachmentUrl: { type: DataTypes.TEXT, allowNull: true, comment: 'Attachment URL' },
        attachmentType: { type: DataTypes.STRING(50), allowNull: true, comment: 'Attachment type' },
        replyToMessageId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reply to message ID' },
        isEdited: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is edited' },
        editedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Edit timestamp' },
        isPinned: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is pinned' },
        reactions: { type: DataTypes.JSON, allowNull: true, comment: 'Reactions (JSON)' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'messages', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['conversationId'], name: 'idx_messages_conversationId' },
          { fields: ['senderUserId'], name: 'idx_messages_senderUserId' },
          { fields: ['messageType'], name: 'idx_messages_messageType' },
          { fields: ['isPinned'], name: 'idx_messages_isPinned' },
          { fields: ['createdAt'], name: 'idx_messages_createdAt' },
          { fields: ['uuid'], name: 'idx_messages_uuid' },
        ],
        comment: 'Messages'
      }
    );
    return Message;
  }
}
