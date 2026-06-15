import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

export interface INotificationPreference {
  id: bigint;
  organizationId: bigint;
  staffId: bigint;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  realTimeEnabled: boolean;
  inAppEnabled: boolean;
  dailyDigestEnabled: boolean;
  categories: string[];
  quietHours: { startTime: string; endTime: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

type NotificationPreferenceCreationAttributes = Optional<INotificationPreference, 'id' | 'createdAt' | 'updatedAt' | 'emailEnabled' | 'smsEnabled' | 'pushEnabled' | 'realTimeEnabled' | 'inAppEnabled' | 'dailyDigestEnabled' | 'quietHours'>;

export class NotificationPreference extends Model<INotificationPreference, NotificationPreferenceCreationAttributes> implements INotificationPreference {
  public id!: bigint;
  public organizationId!: bigint;
  public staffId!: bigint;
  public emailEnabled!: boolean;
  public smsEnabled!: boolean;
  public pushEnabled!: boolean;
  public realTimeEnabled!: boolean;
  public inAppEnabled!: boolean;
  public dailyDigestEnabled!: boolean;
  public categories!: string[];
  public quietHours!: { startTime: string; endTime: string } | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NotificationPreference.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: DataTypes.BIGINT, allowNull: false },
    staffId: { type: DataTypes.BIGINT, allowNull: false },
    emailEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    smsEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    pushEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    realTimeEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    inAppEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    dailyDigestEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    categories: { type: DataTypes.JSON, defaultValue: ['ATTENDANCE', 'LEAVE', 'SYSTEM'], comment: 'Enabled notification categories' },
    quietHours: { type: DataTypes.JSON, allowNull: true, comment: 'No notifications between these times' },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'notification_preferences',
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'staffId'], unique: true },
    ],
  }
);

export default NotificationPreference;
