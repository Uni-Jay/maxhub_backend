import { Model, Optional, Sequelize } from 'sequelize';
interface AIReminderAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    type: string;
    title: string;
    message: string;
    urgency: 'critical' | 'high' | 'normal';
    suggestedSendTime?: string;
    context: object;
    dueDate?: Date;
    sent: boolean;
    sentAt?: Date;
    model: string;
    deletedAt?: Date;
}
interface AIReminderCreationAttributes extends Optional<AIReminderAttributes, 'id' | 'uuid' | 'sent' | 'sentAt' | 'dueDate' | 'suggestedSendTime'> {
}
export declare class AIReminder extends Model<AIReminderAttributes, AIReminderCreationAttributes> implements AIReminderAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    type: string;
    title: string;
    message: string;
    urgency: 'critical' | 'high' | 'normal';
    suggestedSendTime?: string;
    context: object;
    dueDate?: Date;
    sent: boolean;
    sentAt?: Date;
    model: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof AIReminder;
}
export {};
//# sourceMappingURL=AIReminder.model.d.ts.map