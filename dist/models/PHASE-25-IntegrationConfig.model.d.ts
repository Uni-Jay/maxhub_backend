import { Model, Optional } from 'sequelize';
interface PHASE25_IntegrationConfigAttributes {
    id: number;
    organizationId: number;
    integrationType: 'SMS' | 'EMAIL' | 'PAYMENT' | 'STORAGE' | 'DOCUMENT_SIGNING' | 'ANALYTICS' | 'VOIP' | 'CUSTOM';
    providerName: 'TWILIO' | 'SENDGRID' | 'AWS_SES' | 'STRIPE' | 'RAZORPAY' | 'DOCUSIGN' | 'AWS_S3' | 'AZURE_BLOB' | 'FIREBASE' | 'CUSTOM';
    apiKey: string;
    apiSecret: string;
    webhookUrl: string;
    webhookSecret: string;
    customConfig: any;
    isActive: boolean;
    isVerified: boolean;
    verifiedAt: Date;
    testConnectionResult: any;
    lastTestAt: Date;
    updatedBy: number;
    createdAt: Date;
    updatedAt: Date;
}
interface PHASE25_IntegrationConfigCreationAttributes extends Optional<PHASE25_IntegrationConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class PHASE25_IntegrationConfig extends Model<PHASE25_IntegrationConfigAttributes, PHASE25_IntegrationConfigCreationAttributes> implements PHASE25_IntegrationConfigAttributes {
    id: number;
    organizationId: number;
    integrationType: 'SMS' | 'EMAIL' | 'PAYMENT' | 'STORAGE' | 'DOCUMENT_SIGNING' | 'ANALYTICS' | 'VOIP' | 'CUSTOM';
    providerName: 'TWILIO' | 'SENDGRID' | 'AWS_SES' | 'STRIPE' | 'RAZORPAY' | 'DOCUSIGN' | 'AWS_S3' | 'AZURE_BLOB' | 'FIREBASE' | 'CUSTOM';
    apiKey: string;
    apiSecret: string;
    webhookUrl: string;
    webhookSecret: string;
    customConfig: any;
    isActive: boolean;
    isVerified: boolean;
    verifiedAt: Date;
    testConnectionResult: any;
    lastTestAt: Date;
    updatedBy: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default PHASE25_IntegrationConfig;
//# sourceMappingURL=PHASE-25-IntegrationConfig.model.d.ts.map