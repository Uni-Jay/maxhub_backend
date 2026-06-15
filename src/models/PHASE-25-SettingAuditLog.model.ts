import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface PHASE25_SettingAuditLogAttributes {
  id: number;
  organizationId: number;
  settingKey: string;
  oldValue: any;
  newValue: any;
  changedBy: number;
  reason: string;
  changeType: 'SYSTEM' | 'DEPARTMENT' | 'EMAIL' | 'BRANDING' | 'THEME' | 'INTEGRATION';
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

interface PHASE25_SettingAuditLogCreationAttributes extends Optional<PHASE25_SettingAuditLogAttributes, 'id' | 'createdAt'> {}

class PHASE25_SettingAuditLog extends Model<PHASE25_SettingAuditLogAttributes, PHASE25_SettingAuditLogCreationAttributes> implements PHASE25_SettingAuditLogAttributes {
  public id!: number;
  public organizationId!: number;
  public settingKey!: string;
  public oldValue!: any;
  public newValue!: any;
  public changedBy!: number;
  public reason!: string;
  public changeType!: 'SYSTEM' | 'DEPARTMENT' | 'EMAIL' | 'BRANDING' | 'THEME' | 'INTEGRATION';
  public ipAddress!: string;
  public userAgent!: string;
  public readonly createdAt!: Date;
}

PHASE25_SettingAuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    settingKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    oldValue: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    changedBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changeType: {
      type: DataTypes.ENUM('SYSTEM', 'DEPARTMENT', 'EMAIL', 'BRANDING', 'THEME', 'INTEGRATION'),
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'phase25_setting_audit_log',
    timestamps: false,
    indexes: [
      {
        fields: ['organizationId', 'settingKey', 'createdAt'],
      },
      {
        fields: ['changedBy', 'createdAt'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default PHASE25_SettingAuditLog;
