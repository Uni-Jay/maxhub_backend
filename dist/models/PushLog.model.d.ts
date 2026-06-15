import { Model, Optional } from 'sequelize';
export interface IPushLog {
    id: bigint;
    organizationId: bigint;
    notificationId: bigint;
    deviceToken: string;
    devicePlatform: 'IOS' | 'ANDROID' | 'WEB';
    title: string;
    body: string;
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
type PushLogCreationAttributes = Optional<IPushLog, 'id' | 'createdAt' | 'updatedAt' | 'sentAt' | 'deliveredAt' | 'failureReason' | 'providerReference' | 'retryCount' | 'lastRetryAt'>;
export declare class PushLog extends Model<IPushLog, PushLogCreationAttributes> implements IPushLog {
    id: bigint;
    organizationId: bigint;
    notificationId: bigint;
    deviceToken: string;
    devicePlatform: 'IOS' | 'ANDROID' | 'WEB';
    title: string;
    body: string;
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
export default PushLog;
//# sourceMappingURL=PushLog.model.d.ts.map