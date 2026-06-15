import { Model, Optional, Sequelize } from 'sequelize';
interface CourseAttributes {
    id: bigint;
    uuid: string;
    courseCode: string;
    title: string;
    description?: string;
    departmentId?: bigint;
    instructorId: bigint;
    categoryId?: bigint;
    duration: number;
    maxParticipants?: number;
    minParticipants?: number;
    fee?: number;
    startDate: Date;
    endDate?: Date;
    status: 'Draft' | 'Published' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Archived';
    certificateRequired?: boolean;
    passingScore?: number;
    createdById: bigint;
    deletedAt?: Date;
}
interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'uuid'> {
}
export declare class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
    id: bigint;
    uuid: string;
    courseCode: string;
    title: string;
    description?: string;
    departmentId?: bigint;
    instructorId: bigint;
    categoryId?: bigint;
    duration: number;
    maxParticipants?: number;
    minParticipants?: number;
    fee?: number;
    startDate: Date;
    endDate?: Date;
    status: 'Draft' | 'Published' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Archived';
    certificateRequired?: boolean;
    passingScore?: number;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Course;
    isEnrollmentOpen(): boolean;
    isOngoing(): boolean;
}
export {};
//# sourceMappingURL=Course.model.d.ts.map