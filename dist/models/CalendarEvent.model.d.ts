import { Model, Optional } from 'sequelize';
interface CalendarEventAttributes {
    id: bigint;
    uuid: string;
    title: string;
    date: Date;
    endDate?: Date;
    type: 'Meeting' | 'Task' | 'Reminder' | 'Holiday' | 'Other';
    description?: string;
    attendees?: string;
    createdById?: bigint;
    deletedAt?: Date;
}
interface CalendarEventCreationAttributes extends Optional<CalendarEventAttributes, 'id' | 'uuid'> {
}
export declare class CalendarEvent extends Model<CalendarEventAttributes, CalendarEventCreationAttributes> implements CalendarEventAttributes {
    id: bigint;
    uuid: string;
    title: string;
    date: Date;
    endDate?: Date;
    type: 'Meeting' | 'Task' | 'Reminder' | 'Holiday' | 'Other';
    description?: string;
    attendees?: string;
    createdById?: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default CalendarEvent;
//# sourceMappingURL=CalendarEvent.model.d.ts.map