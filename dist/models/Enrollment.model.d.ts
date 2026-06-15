import { Model, Optional, Sequelize } from 'sequelize';
interface EnrollmentAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    staffId: bigint;
    enrollmentDate: Date;
    completionDate?: Date;
    status: 'Enrolled' | 'InProgress' | 'Completed' | 'Failed' | 'Dropped' | 'OnHold';
    progressPercentage: number;
    certificateId?: bigint;
    notes?: string;
    deletedAt?: Date;
}
interface EnrollmentCreationAttributes extends Optional<EnrollmentAttributes, 'id' | 'uuid'> {
}
export declare class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes> implements EnrollmentAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    staffId: bigint;
    enrollmentDate: Date;
    completionDate?: Date;
    status: 'Enrolled' | 'InProgress' | 'Completed' | 'Failed' | 'Dropped' | 'OnHold';
    progressPercentage: number;
    certificateId?: bigint;
    notes?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Enrollment;
}
export {};
//# sourceMappingURL=Enrollment.model.d.ts.map