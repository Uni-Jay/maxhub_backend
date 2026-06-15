import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface PHASE25_FeatureFlagAttributes {
  id: number;
  organizationId: number;
  flagKey: string;
  flagName: string;
  description: string;
  isEnabled: boolean;
  flagType: 'BOOLEAN' | 'PERCENTAGE' | 'USER_LIST' | 'CUSTOM';
  rolloutPercentage: number; // 0-100, for percentage-based rollout
  targetUsers: any; // JSON array of staffIds
  targetRoles: any; // JSON array of roles
  targetDepartments: any; // JSON array of departmentIds
  conditions: any; // JSON for complex conditions
  metadata: any; // JSON for additional data
  createdBy: number;
  updatedBy: number;
  enabledAt: Date;
  disabledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PHASE25_FeatureFlagCreationAttributes extends Optional<PHASE25_FeatureFlagAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PHASE25_FeatureFlag extends Model<PHASE25_FeatureFlagAttributes, PHASE25_FeatureFlagCreationAttributes> implements PHASE25_FeatureFlagAttributes {
  public id!: number;
  public organizationId!: number;
  public flagKey!: string;
  public flagName!: string;
  public description!: string;
  public isEnabled!: boolean;
  public flagType!: 'BOOLEAN' | 'PERCENTAGE' | 'USER_LIST' | 'CUSTOM';
  public rolloutPercentage!: number;
  public targetUsers!: any;
  public targetRoles!: any;
  public targetDepartments!: any;
  public conditions!: any;
  public metadata!: any;
  public createdBy!: number;
  public updatedBy!: number;
  public enabledAt!: Date;
  public disabledAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PHASE25_FeatureFlag.init(
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
    flagKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Unique flag key (e.g., new_dashboard_v2)',
    },
    flagName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    flagType: {
      type: DataTypes.ENUM('BOOLEAN', 'PERCENTAGE', 'USER_LIST', 'CUSTOM'),
      allowNull: false,
      defaultValue: 'BOOLEAN',
    },
    rolloutPercentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
      comment: 'For gradual rollout (0-100%)',
    },
    targetUsers: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of staffIds for USER_LIST type',
    },
    targetRoles: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of roles (ADMIN, MANAGER, etc)',
    },
    targetDepartments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of departmentIds',
    },
    conditions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Complex conditions for CUSTOM type',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional data (analytics, tracking, etc)',
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    enabledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disabledAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'phase25_feature_flag',
    timestamps: true,
    indexes: [
      {
        fields: ['organizationId', 'flagKey'],
        unique: true,
      },
      {
        fields: ['organizationId', 'isEnabled'],
      },
    ],
  }
);

export default PHASE25_FeatureFlag;
