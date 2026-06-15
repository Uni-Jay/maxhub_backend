import { Model, Optional } from 'sequelize';
interface PHASE25_EmailConfigAttributes {
    id: number;
    organizationId: number;
    providerType: 'SMTP' | 'SENDGRID' | 'AWS_SES' | 'MAILGUN';
    hostname: string;
    port: number;
    username: string;
    passwordEncrypted: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
    useSSL: boolean;
    useTLS: boolean;
    isActive: boolean;
    isDefault: boolean;
    webhookUrl?: string;
    webhookSecret?: string;
    bounceHandling: 'SOFT' | 'HARD' | 'BOTH';
    maxRetries: number;
    retryDelayMinutes: number;
    updatedBy: number;
    createdAt: Date;
    updatedAt: Date;
}
interface PHASE25_EmailConfigCreationAttributes extends Optional<PHASE25_EmailConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class PHASE25_EmailConfig extends Model<PHASE25_EmailConfigAttributes, PHASE25_EmailConfigCreationAttributes> implements PHASE25_EmailConfigAttributes {
    id: number;
    organizationId: number;
    providerType: 'SMTP' | 'SENDGRID' | 'AWS_SES' | 'MAILGUN';
    hostname: string;
    port: number;
    username: string;
    passwordEncrypted: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
    useSSL: boolean;
    useTLS: boolean;
    isActive: boolean;
    isDefault: boolean;
    webhookUrl?: string;
    webhookSecret?: string;
    bounceHandling: 'SOFT' | 'HARD' | 'BOTH';
    maxRetries: number;
    retryDelayMinutes: number;
    updatedBy: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default PHASE25_EmailConfig;
//# sourceMappingURL=PHASE-25-EmailConfig.model.d.ts.map