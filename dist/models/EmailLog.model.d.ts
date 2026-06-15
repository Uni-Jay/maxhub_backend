import { Model, Optional } from 'sequelize';
export interface IEmailLog {
    id: bigint;
    organizationId: bigint;
    notificationId: bigint;
    recipientEmail: string;
    subject: string;
    bodyHtml: string;
    deliveryStatus: 'QUEUED' | 'SENDING' | 'SENT' | 'BOUNCED' | 'FAILED';
    sentAt?: Date;
    deliveredAt?: Date;
    bouncedAt?: Date;
    failureReason?: string;
    providerReference?: string;
    retryCount: number;
    lastRetryAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
type EmailLogCreationAttributes = Optional<IEmailLog, 'id' | 'createdAt' | 'updatedAt' | 'sentAt' | 'deliveredAt' | 'bouncedAt' | 'failureReason' | 'providerReference' | 'retryCount' | 'lastRetryAt'>;
export declare class EmailLog extends Model<IEmailLog, EmailLogCreationAttributes> implements IEmailLog {
    id: bigint;
    organizationId: bigint;
    notificationId: bigint;
    recipientEmail: string;
    subject: string;
    bodyHtml: string;
    deliveryStatus: 'QUEUED' | 'SENDING' | 'SENT' | 'BOUNCED' | 'FAILED';
    sentAt?: Date;
    deliveredAt?: Date;
    bouncedAt?: Date;
    failureReason?: string;
    providerReference?: string;
    retryCount: number;
    lastRetryAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default EmailLog;
//# sourceMappingURL=EmailLog.model.d.ts.map