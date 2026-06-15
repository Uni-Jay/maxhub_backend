import { Model } from 'sequelize';
export interface IStudentEnrollment {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    studentId: bigint;
    enrollmentDate: Date;
    completionDate?: Date;
    status: 'Active' | 'Completed' | 'Dropped' | 'Suspended';
    progress: number;
    totalScore?: number;
    certificateId?: bigint;
    certificateEarned: boolean;
    certificateDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class StudentEnrollment extends Model<IStudentEnrollment> implements IStudentEnrollment {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    studentId: bigint;
    enrollmentDate: Date;
    completionDate?: Date;
    status: 'Active' | 'Completed' | 'Dropped' | 'Suspended';
    progress: number;
    totalScore?: number;
    certificateId?: bigint;
    certificateEarned: boolean;
    certificateDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default StudentEnrollment;
//# sourceMappingURL=LMS-StudentEnrollment.model.d.ts.map