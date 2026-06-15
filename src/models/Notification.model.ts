import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface NotificationAttributes {
  id: bigint;
  uuid: string;
  recipientUserId: bigint;
  notificationType: 'Message' | 'Mention' | 'Assignment' | 'Leave' | 'Payroll' | 'System' | 'Alert' | 'Other';
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: bigint;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  deliveryChannel: 'InApp' | 'Email' | 'SMS' | 'Push';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  deletedAt?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'uuid'> {}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes {
  public id!: bigint;
  public uuid!: string;
  public recipientUserId!: bigint;
  public notificationType!: 'Message' | 'Mention' | 'Assignment' | 'Leave' | 'Payroll' | 'System' | 'Alert' | 'Other';
  public title!: string;
  public message!: string;
  public relatedEntityType?: string;
  public relatedEntityId?: bigint;
  public actionUrl?: string;
  public isRead!: boolean;
  public readAt?: Date;
  public deliveryChannel!: 'InApp' | 'Email' | 'SMS' | 'Push';
  public priority!: 'Low' | 'Medium' | 'High' | 'Urgent';
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Notification {
    Notification.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        recipientUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Recipient user ID' },
        notificationType: { type: DataTypes.ENUM('Message', 'Mention', 'Assignment', 'Leave', 'Payroll', 'System', 'Alert', 'Other'), allowNull: false },
        title: { type: DataTypes.STRING(200), allowNull: false, comment: 'Notification title' },
        message: { type: DataTypes.TEXT, allowNull: false, comment: 'Notification message' },
        relatedEntityType: { type: DataTypes.STRING(50), allowNull: true, comment: 'Related entity type' },
        relatedEntityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Related entity ID' },
        actionUrl: { type: DataTypes.TEXT, allowNull: true, comment: 'Action URL' },
        isRead: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is read' },
        readAt: { type: DataTypes.DATE, allowNull: true, comment: 'When read' },
        deliveryChannel: { type: DataTypes.ENUM('InApp', 'Email', 'SMS', 'Push'), defaultValue: 'InApp' },
        priority: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'), defaultValue: 'Medium' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'notifications', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['recipientUserId'], name: 'idx_notifications_recipientUserId' },
          { fields: ['notificationType'], name: 'idx_notifications_notificationType' },
          { fields: ['isRead'], name: 'idx_notifications_isRead' },
          { fields: ['priority'], name: 'idx_notifications_priority' },
          { fields: ['deliveryChannel'], name: 'idx_notifications_deliveryChannel' },
          { fields: ['createdAt'], name: 'idx_notifications_createdAt' },
          { fields: ['uuid'], name: 'idx_notifications_uuid' },
        ],
        comment: 'Notifications'
      }
    );
    return Notification;
  }
}
