import { Model, Optional } from 'sequelize';
export interface ISMSLog {
    id: bigint;
    organizationId: bigint;
    notificationId: bigint;
    recipientPhone: string;
    messageText: string;
    deliveryStatus: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
    sentAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
    providerReference?: string;
    retryCount: number;
    lastRetryAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
type SMSLogCreationAttributes = Optional<ISMSLog, 'id' | 'createdAt' | 'updatedAt' | 'sentAt' | 'deliveredAt' | 'failureReason' | 'providerReference' | 'retryCount' | 'lastRetryAt'>;
export declare class SMSLog extends Model<ISMSLog, SMSLogCreationAttributes> implements ISMSLog {
    id: bigint;
    organizationId: bigint;
    notificationId: bigint;
    recipientPhone: string;
    messageText: string;
    deliveryStatus: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
    sentAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
    providerReference?: string;
    retryCount: number;
    lastRetryAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default SMSLog;
//# sourceMappingURL=SMSLog.model.d.ts.map