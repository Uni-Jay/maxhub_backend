import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface PHASE25_BrandingConfigAttributes {
  id: number;
  organizationId: number;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerText: string;
  companyName: string;
  companyWebsite: string;
  socialMedia: any; // JSON { facebook, twitter, linkedin, instagram }
  emailTemplateHeaderHtml: string;
  emailTemplateFooterHtml: string;
  emailSignature: string;
  customDomain: string;
  brandingAssets: any; // JSON with asset metadata
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PHASE25_BrandingConfigCreationAttributes extends Optional<PHASE25_BrandingConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PHASE25_BrandingConfig extends Model<PHASE25_BrandingConfigAttributes, PHASE25_BrandingConfigCreationAttributes> implements PHASE25_BrandingConfigAttributes {
  public id!: number;
  public organizationId!: number;
  public logoUrl!: string;
  public faviconUrl!: string;
  public primaryColor!: string;
  public secondaryColor!: string;
  public accentColor!: string;
  public footerText!: string;
  public companyName!: string;
  public companyWebsite!: string;
  public socialMedia!: any;
  public emailTemplateHeaderHtml!: string;
  public emailTemplateFooterHtml!: string;
  public emailSignature!: string;
  public customDomain!: string;
  public brandingAssets!: any;
  public updatedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PHASE25_BrandingConfig.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'S3/CDN URL to logo',
    },
    faviconUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    primaryColor: {
      type: DataTypes.STRING(7),
      allowNull: true,
      comment: 'Hex color code #RRGGBB',
    },
    secondaryColor: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    accentColor: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    footerText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    companyWebsite: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    socialMedia: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON: { facebook, twitter, linkedin, instagram }',
    },
    emailTemplateHeaderHtml: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emailTemplateFooterHtml: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emailSignature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customDomain: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    brandingAssets: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Asset metadata: { logos: [], backgrounds: [] }',
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
    tableName: 'phase25_branding_config',
    timestamps: true,
  }
);

export default PHASE25_BrandingConfig;
