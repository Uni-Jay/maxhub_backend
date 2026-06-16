import { Model, Optional, Sequelize } from 'sequelize';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
interface ClassScheduleAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    programId?: bigint;
    instructorId?: bigint;
    title: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    venue?: string;
    isOnline: boolean;
    meetingLink?: string;
    meetingPassword?: string;
    effectiveFrom: Date;
    effectiveUntil?: Date;
    isActive: boolean;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface ClassScheduleCreationAttributes extends Optional<ClassScheduleAttributes, 'id' | 'uuid' | 'isOnline' | 'isActive'> {
}
export declare class ClassSchedule extends Model<ClassScheduleAttributes, ClassScheduleCreationAttributes> implements ClassScheduleAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    programId?: bigint;
    instructorId?: bigint;
    title: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    venue?: string;
    isOnline: boolean;
    meetingLink?: string;
    meetingPassword?: string;
    effectiveFrom: Date;
    effectiveUntil?: Date;
    isActive: boolean;
    notes?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof ClassSchedule;
}
export default ClassSchedule;
//# sourceMappingURL=ClassSchedule.model.d.ts.map