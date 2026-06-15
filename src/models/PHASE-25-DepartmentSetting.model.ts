import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface PHASE25_DepartmentSettingAttributes {
  id: number;
  organizationId: number;
  departmentId: number;
  settingKey: string;
  settingValue: any;
  settingType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE';
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PHASE25_DepartmentSettingCreationAttributes extends Optional<PHASE25_DepartmentSettingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PHASE25_DepartmentSetting extends Model<PHASE25_DepartmentSettingAttributes, PHASE25_DepartmentSettingCreationAttributes> implements PHASE25_DepartmentSettingAttributes {
  public id!: number;
  public organizationId!: number;
  public departmentId!: number;
  public settingKey!: string;
  public settingValue!: any;
  public settingType!: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE';
  public updatedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PHASE25_DepartmentSetting.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Multi-tenant org',
    },
    departmentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Department',
    },
    settingKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'e.g., leave_quota, budget_allocation',
    },
    settingValue: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    settingType: {
      type: DataTypes.ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE'),
      allowNull: false,
      defaultValue: 'STRING',
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'phase25_department_settings',
    timestamps: true,
    indexes: [
      {
        fields: ['organizationId', 'departmentId', 'settingKey'],
        unique: true,
      },
      {
        fields: ['departmentId', 'settingKey'],
      },
    ],
  }
);

export default PHASE25_DepartmentSetting;
