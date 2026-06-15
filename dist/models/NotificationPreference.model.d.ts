import { Model, Optional } from 'sequelize';
export interface INotificationPreference {
    id: bigint;
    organizationId: bigint;
    staffId: bigint;
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    realTimeEnabled: boolean;
    inAppEnabled: boolean;
    dailyDigestEnabled: boolean;
    categories: string[];
    quietHours: {
        startTime: string;
        endTime: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
}
type NotificationPreferenceCreationAttributes = Optional<INotificationPreference, 'id' | 'createdAt' | 'updatedAt' | 'emailEnabled' | 'smsEnabled' | 'pushEnabled' | 'realTimeEnabled' | 'inAppEnabled' | 'dailyDigestEnabled' | 'quietHours'>;
export declare class NotificationPreference extends Model<INotificationPreference, NotificationPreferenceCreationAttributes> implements INotificationPreference {
    id: bigint;
    organizationId: bigint;
    staffId: bigint;
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    realTimeEnabled: boolean;
    inAppEnabled: boolean;
    dailyDigestEnabled: boolean;
    categories: string[];
    quietHours: {
        startTime: string;
        endTime: string;
    } | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default NotificationPreference;
//# sourceMappingURL=NotificationPreference.model.d.ts.map