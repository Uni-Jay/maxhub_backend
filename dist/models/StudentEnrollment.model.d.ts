import { Model, Optional, Sequelize } from 'sequelize';
export type EnrollmentStatus = 'Active' | 'Completed' | 'Dropped' | 'Pending' | 'Suspended';
interface StudentEnrollmentAttributes {
    id: bigint;
    uuid: string;
    studentId: bigint;
    courseId: bigint;
    programId?: bigint;
    enrolledById?: bigint;
    enrolledAt: Date;
    completedAt?: Date;
    droppedAt?: Date;
    dropReason?: string;
    status: EnrollmentStatus;
    progressPercentage: number;
    grade?: string;
    gradePoints?: number;
    isCertificateIssued: boolean;
    certificateIssuedAt?: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface StudentEnrollmentCreationAttributes extends Optional<StudentEnrollmentAttributes, 'id' | 'uuid' | 'status' | 'progressPercentage' | 'isCertificateIssued' | 'enrolledAt'> {
}
export declare class StudentEnrollment extends Model<StudentEnrollmentAttributes, StudentEnrollmentCreationAttributes> implements StudentEnrollmentAttributes {
    id: bigint;
    uuid: string;
    studentId: bigint;
    courseId: bigint;
    programId?: bigint;
    enrolledById?: bigint;
    enrolledAt: Date;
    completedAt?: Date;
    droppedAt?: Date;
    dropReason?: string;
    status: EnrollmentStatus;
    progressPercentage: number;
    grade?: string;
    gradePoints?: number;
    isCertificateIssued: boolean;
    certificateIssuedAt?: Date;
    notes?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StudentEnrollment;
}
export default StudentEnrollment;
//# sourceMappingURL=StudentEnrollment.model.d.ts.map