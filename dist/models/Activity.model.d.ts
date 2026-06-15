import { Model, Optional, Sequelize } from 'sequelize';
interface ActivityAttributes {
    id: bigint;
    uuid: string;
    relatedEntityType: string;
    relatedEntityId: bigint;
    activityType: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Note' | 'WhatsApp' | 'SMS' | 'Other';
    subject: string;
    description?: string;
    activityDate: Date;
    dueDate?: Date;
    ownerUserId: bigint;
    participantIds?: string;
    status: 'Open' | 'Completed' | 'Cancelled';
    outcome?: string;
    notes?: string;
    deletedAt?: Date;
}
interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'uuid'> {
}
export declare class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
    id: bigint;
    uuid: string;
    relatedEntityType: string;
    relatedEntityId: bigint;
    activityType: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Note' | 'WhatsApp' | 'SMS' | 'Other';
    subject: string;
    description?: string;
    activityDate: Date;
    dueDate?: Date;
    ownerUserId: bigint;
    participantIds?: string;
    status: 'Open' | 'Completed' | 'Cancelled';
    outcome?: string;
    notes?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Activity;
}
export {};
//# sourceMappingURL=Activity.model.d.ts.map