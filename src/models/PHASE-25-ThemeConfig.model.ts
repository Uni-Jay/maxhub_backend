import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface PHASE25_ThemeConfigAttributes {
  id: number;
  organizationId: number;
  themeName: string;
  isDarkMode: boolean;
  fontFamily: string;
  fontSize: number;
  colorScheme: any; // JSON
  layoutPreferences: any; // JSON
  componentStyles: any; // JSON with custom component styles
  isDefault: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PHASE25_ThemeConfigCreationAttributes extends Optional<PHASE25_ThemeConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PHASE25_ThemeConfig extends Model<PHASE25_ThemeConfigAttributes, PHASE25_ThemeConfigCreationAttributes> implements PHASE25_ThemeConfigAttributes {
  public id!: number;
  public organizationId!: number;
  public themeName!: string;
  public isDarkMode!: boolean;
  public fontFamily!: string;
  public fontSize!: number;
  public colorScheme!: any;
  public layoutPreferences!: any;
  public componentStyles!: any;
  public isDefault!: boolean;
  public createdBy!: number;
  public updatedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PHASE25_ThemeConfig.init(
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
    themeName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isDarkMode: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fontFamily: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'Inter, system-ui',
    },
    fontSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 14,
    },
    colorScheme: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON: { primary, secondary, accent, background, text }',
    },
    layoutPreferences: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON: { sidebarCollapsed, compactMode }',
    },
    componentStyles: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Custom styles for components',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff',
    },
    updatedBy: {
      type: DataTypes.BIGINT,
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
    tableName: 'phase25_theme_config',
    timestamps: true,
    indexes: [
      {
        fields: ['organizationId', 'isDefault'],
      },
    ],
  }
);

export default PHASE25_ThemeConfig;
