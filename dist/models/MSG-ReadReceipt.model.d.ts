import { Model } from 'sequelize';
export interface IReadReceipt {
    id: bigint;
    organizationId: bigint;
    directMessageId?: bigint;
    chatMessageId?: bigint;
    readBy: bigint;
    readAt: Date;
    readFrom: 'Web' | 'Mobile' | 'Desktop' | 'API';
    deviceInfo?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ReadReceipt extends Model<IReadReceipt> implements IReadReceipt {
    id: bigint;
    organizationId: bigint;
    directMessageId?: bigint;
    chatMessageId?: bigint;
    readBy: bigint;
    readAt: Date;
    readFrom: 'Web' | 'Mobile' | 'Desktop' | 'API';
    deviceInfo?: string;
    createdAt: Date;
    updatedAt: Date;
}
export default ReadReceipt;
//# sourceMappingURL=MSG-ReadReceipt.model.d.ts.map