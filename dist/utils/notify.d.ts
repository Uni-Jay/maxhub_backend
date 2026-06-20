type NotificationType = 'Message' | 'Mention' | 'Assignment' | 'Leave' | 'Payroll' | 'System' | 'Alert' | 'Other';
type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
interface NotifyParams {
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: bigint | number | string;
    actionUrl?: string;
    priority?: NotificationPriority;
}
export declare function notifyUser(userId: bigint | number | string, params: NotifyParams, io?: any): Promise<void>;
export declare function notifyStaff(staffId: bigint | number | string, params: NotifyParams, io?: any): Promise<void>;
export {};
//# sourceMappingURL=notify.d.ts.map