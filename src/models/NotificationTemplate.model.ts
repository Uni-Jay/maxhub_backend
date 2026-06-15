import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

export interface INotificationTemplate {
  id: bigint;
  organizationId: bigint;
  name: string;
  code: string;
  category: 'ATTENDANCE' | 'LEAVE' | 'PERFORMANCE' | 'SYSTEM' | 'MESSAGING' | 'ALERT';
  type: 'REAL_TIME' | 'EMAIL' | 'SMS' | 'PUSH';
  subject?: string;
  templateBody: string;
  variables: string[];
  isActive: boolean;
  createdBy: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
}

type NotificationTemplateCreationAttributes = Optional<INotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;

export class NotificationTemplate extends Model<INotificationTemplate, NotificationTemplateCreationAttributes> implements INotificationTemplate {
  public id!: bigint;
  public organizationId!: bigint;
  public name!: string;
  public code!: string;
  public category!: 'ATTENDANCE' | 'LEAVE' | 'PERFORMANCE' | 'SYSTEM' | 'MESSAGING' | 'ALERT';
  public type!: 'REAL_TIME' | 'EMAIL' | 'SMS' | 'PUSH';
  public subject?: string;
  public templateBody!: string;
  public variables!: string[];
  public isActive!: boolean;
  public createdBy!: bigint;
  public updatedBy?: bigint;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NotificationTemplate.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true, comment: 'Template identifier' },
    category: { type: DataTypes.ENUM('ATTENDANCE', 'LEAVE', 'PERFORMANCE', 'SYSTEM', 'MESSAGING', 'ALERT'), allowNull: false },
    type: { type: DataTypes.ENUM('REAL_TIME', 'EMAIL', 'SMS', 'PUSH'), allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: true, comment: 'For email notifications' },
    templateBody: { type: DataTypes.TEXT, allowNull: false, comment: 'Template with {{variables}}' },
    variables: { type: DataTypes.JSON, allowNull: false, comment: 'List of required variables' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdBy: { type: DataTypes.BIGINT, allowNull: false },
    updatedBy: { type: DataTypes.BIGINT, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'notification_templates',
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'type'] },
      { fields: ['code'], unique: true },
    ],
  }
);

export default NotificationTemplate;
