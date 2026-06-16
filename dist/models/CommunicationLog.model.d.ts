import { Model, Sequelize, Optional } from 'sequelize';
export interface CommunicationLogAttributes {
    id: bigint;
    uuid: string;
    type: 'Weekly' | 'Birthday' | 'Manual' | 'Scheduled';
    channel: 'Email' | 'SMS' | 'WhatsApp';
    recipientType: 'All' | 'Department' | 'Selected' | 'Country' | 'Status';
    recipientFilter?: string;
    subject?: string;
    message: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    status: 'Pending' | 'Sending' | 'Completed' | 'Failed' | 'Partial';
    scheduledAt?: Date;
    sentAt?: Date;
    createdByUserId?: bigint;
    errorDetails?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface CommunicationLogCreationAttributes extends Optional<CommunicationLogAttributes, 'id' | 'uuid' | 'recipientFilter' | 'subject' | 'totalRecipients' | 'successCount' | 'failureCount' | 'status' | 'scheduledAt' | 'sentAt' | 'createdByUserId' | 'errorDetails' | 'createdAt' | 'updatedAt'> {
}
export declare class CommunicationLog extends Model<CommunicationLogAttributes, CommunicationLogCreationAttributes> implements CommunicationLogAttributes {
    id: bigint;
    uuid: string;
    type: 'Weekly' | 'Birthday' | 'Manual' | 'Scheduled';
    channel: 'Email' | 'SMS' | 'WhatsApp';
    recipientType: 'All' | 'Department' | 'Selected' | 'Country' | 'Status';
    recipientFilter?: string;
    subject?: string;
    message: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    status: 'Pending' | 'Sending' | 'Completed' | 'Failed' | 'Partial';
    scheduledAt?: Date;
    sentAt?: Date;
    createdByUserId?: bigint;
    errorDetails?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): void;
}
export default CommunicationLog;
//# sourceMappingURL=CommunicationLog.model.d.ts.map