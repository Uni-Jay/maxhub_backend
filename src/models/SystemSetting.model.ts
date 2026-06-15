import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface SystemSettingAttributes {
  id: bigint;
  uuid: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  category: string;
  dataType: 'String' | 'Number' | 'Boolean' | 'JSON';
  isEditable: boolean;
  deletedAt?: Date;
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'id' | 'uuid'> {}

export class SystemSetting extends Model<SystemSettingAttributes, SystemSettingCreationAttributes>
  implements SystemSettingAttributes {
  public id!: bigint;
  public uuid!: string;
  public settingKey!: string;
  public settingValue!: string;
  public description?: string;
  public category!: string;
  public dataType!: 'String' | 'Number' | 'Boolean' | 'JSON';
  public isEditable!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof SystemSetting {
    SystemSetting.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        settingKey: { type: DataTypes.STRING(100), allowNull: false, unique: true, comment: 'Setting key' },
        settingValue: { type: DataTypes.TEXT, allowNull: false, comment: 'Setting value' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        category: { type: DataTypes.STRING(100), allowNull: false, comment: 'Category' },
        dataType: { type: DataTypes.ENUM('String', 'Number', 'Boolean', 'JSON'), defaultValue: 'String' },
        isEditable: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is editable' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'system_settings', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['settingKey'], name: 'idx_system_settings_settingKey' },
          { fields: ['category'], name: 'idx_system_settings_category' },
          { fields: ['uuid'], name: 'idx_system_settings_uuid' },
        ],
        comment: 'System configuration settings'
      }
    );
    return SystemSetting;
  }
}
