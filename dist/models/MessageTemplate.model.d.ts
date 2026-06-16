import { Model, Sequelize, Optional } from 'sequelize';
export interface MessageTemplateAttributes {
    id: bigint;
    uuid: string;
    name: string;
    type: 'Weekly' | 'Birthday' | 'Custom' | 'Welcome' | 'Reminder';
    subject?: string;
    emailContent?: string;
    smsContent?: string;
    whatsappContent?: string;
    isActive: boolean;
    createdByUserId: bigint;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface MessageTemplateCreationAttributes extends Optional<MessageTemplateAttributes, 'id' | 'uuid' | 'subject' | 'emailContent' | 'smsContent' | 'whatsappContent' | 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class MessageTemplate extends Model<MessageTemplateAttributes, MessageTemplateCreationAttributes> implements MessageTemplateAttributes {
    id: bigint;
    uuid: string;
    name: string;
    type: 'Weekly' | 'Birthday' | 'Custom' | 'Welcome' | 'Reminder';
    subject?: string;
    emailContent?: string;
    smsContent?: string;
    whatsappContent?: string;
    isActive: boolean;
    createdByUserId: bigint;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date;
    static initModel(sequelize: Sequelize): void;
}
export default MessageTemplate;
//# sourceMappingURL=MessageTemplate.model.d.ts.map