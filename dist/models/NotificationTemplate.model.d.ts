import { Model, Optional } from 'sequelize';
export interface INotificationTemplate {
    id: bigint;
    organizationId: bigint;
    name: string;
    code: string;
    category: 'ATTENDANCE' | 'LEAVE' | 'PERFORMANCE' | 'SYSTEM' | 'MESSAGING' | 'ALERT';
    type: 'REAL_TIME' | 'EMAIL' | 'SMS' | 'PUSH';
    subject?: string;
    templateBody: string;
    variables: string[];
    isActive: boolean;
    createdBy: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
}
type NotificationTemplateCreationAttributes = Optional<INotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;
export declare class NotificationTemplate extends Model<INotificationTemplate, NotificationTemplateCreationAttributes> implements INotificationTemplate {
    id: bigint;
    organizationId: bigint;
    name: string;
    code: string;
    category: 'ATTENDANCE' | 'LEAVE' | 'PERFORMANCE' | 'SYSTEM' | 'MESSAGING' | 'ALERT';
    type: 'REAL_TIME' | 'EMAIL' | 'SMS' | 'PUSH';
    subject?: string;
    templateBody: string;
    variables: string[];
    isActive: boolean;
    createdBy: bigint;
    updatedBy?: bigint;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default NotificationTemplate;
//# sourceMappingURL=NotificationTemplate.model.d.ts.map