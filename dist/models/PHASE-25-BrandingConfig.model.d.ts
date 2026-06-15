import { Model, Optional } from 'sequelize';
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
    socialMedia: any;
    emailTemplateHeaderHtml: string;
    emailTemplateFooterHtml: string;
    emailSignature: string;
    customDomain: string;
    brandingAssets: any;
    updatedBy: number;
    createdAt: Date;
    updatedAt: Date;
}
interface PHASE25_BrandingConfigCreationAttributes extends Optional<PHASE25_BrandingConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class PHASE25_BrandingConfig extends Model<PHASE25_BrandingConfigAttributes, PHASE25_BrandingConfigCreationAttributes> implements PHASE25_BrandingConfigAttributes {
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
    socialMedia: any;
    emailTemplateHeaderHtml: string;
    emailTemplateFooterHtml: string;
    emailSignature: string;
    customDomain: string;
    brandingAssets: any;
    updatedBy: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default PHASE25_BrandingConfig;
//# sourceMappingURL=PHASE-25-BrandingConfig.model.d.ts.map