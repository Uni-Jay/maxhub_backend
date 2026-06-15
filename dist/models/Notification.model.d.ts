import { Model, Optional, Sequelize } from 'sequelize';
interface NotificationAttributes {
    id: bigint;
    uuid: string;
    recipientUserId: bigint;
    notificationType: 'Message' | 'Mention' | 'Assignment' | 'Leave' | 'Payroll' | 'System' | 'Alert' | 'Other';
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: bigint;
    actionUrl?: string;
    isRead: boolean;
    readAt?: Date;
    deliveryChannel: 'InApp' | 'Email' | 'SMS' | 'Push';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    deletedAt?: Date;
}
interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'uuid'> {
}
export declare class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    id: bigint;
    uuid: string;
    recipientUserId: bigint;
    notificationType: 'Message' | 'Mention' | 'Assignment' | 'Leave' | 'Payroll' | 'System' | 'Alert' | 'Other';
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: bigint;
    actionUrl?: string;
    isRead: boolean;
    readAt?: Date;
    deliveryChannel: 'InApp' | 'Email' | 'SMS' | 'Push';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Notification;
}
export {};
//# sourceMappingURL=Notification.model.d.ts.map