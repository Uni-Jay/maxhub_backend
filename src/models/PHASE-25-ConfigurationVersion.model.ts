import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface PHASE25_ConfigurationVersionAttributes {
  id: number;
  organizationId: number;
  configType: string;
  versionNumber: number;
  configSnapshot: any; // JSON - full config state
  description: string;
  createdBy: number;
  isActive: boolean;
  rolledBackFrom: number; // If this is a rollback, which version?
  rolledBackTo: number; // If this was rolled back, to which version?
  createdAt: Date;
}

interface PHASE25_ConfigurationVersionCreationAttributes extends Optional<PHASE25_ConfigurationVersionAttributes, 'id' | 'createdAt'> {}

class PHASE25_ConfigurationVersion extends Model<PHASE25_ConfigurationVersionAttributes, PHASE25_ConfigurationVersionCreationAttributes> implements PHASE25_ConfigurationVersionAttributes {
  public id!: number;
  public organizationId!: number;
  public configType!: string;
  public versionNumber!: number;
  public configSnapshot!: any;
  public description!: string;
  public createdBy!: number;
  public isActive!: boolean;
  public rolledBackFrom!: number;
  public rolledBackTo!: number;
  public readonly createdAt!: Date;
}

PHASE25_ConfigurationVersion.init(
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
    configType: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Type: SYSTEM, EMAIL, BRANDING, THEME, INTEGRATION',
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    configSnapshot: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Full configuration state at this version',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    rolledBackFrom: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'If this is a rollback result, which version did we roll back from?',
    },
    rolledBackTo: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'If this version was rolled back, which version did we roll back to?',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'phase25_configuration_version',
    timestamps: false,
    indexes: [
      {
        fields: ['organizationId', 'configType', 'versionNumber'],
        unique: true,
      },
      {
        fields: ['organizationId', 'isActive'],
      },
    ],
  }
);

export default PHASE25_ConfigurationVersion;
