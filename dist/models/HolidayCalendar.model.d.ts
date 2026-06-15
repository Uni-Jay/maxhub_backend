import { Model, Optional, Sequelize } from 'sequelize';
interface HolidayCalendarAttributes {
    id: bigint;
    uuid: string;
    holidayCode: string;
    holidayName: string;
    holidayDate: Date;
    year: number;
    type: 'National' | 'Regional' | 'Festival' | 'Company';
    isOptional: boolean;
    description?: string;
    createdById: bigint;
    deletedAt?: Date;
}
interface HolidayCalendarCreationAttributes extends Optional<HolidayCalendarAttributes, 'id' | 'uuid'> {
}
export declare class HolidayCalendar extends Model<HolidayCalendarAttributes, HolidayCalendarCreationAttributes> implements HolidayCalendarAttributes {
    id: bigint;
    uuid: string;
    holidayCode: string;
    holidayName: string;
    holidayDate: Date;
    year: number;
    type: 'National' | 'Regional' | 'Festival' | 'Company';
    isOptional: boolean;
    description?: string;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof HolidayCalendar;
}
export {};
//# sourceMappingURL=HolidayCalendar.model.d.ts.map