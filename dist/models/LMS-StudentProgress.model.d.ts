import { Model } from 'sequelize';
export interface IStudentProgress {
    id: bigint;
    organizationId: bigint;
    studentId: bigint;
    courseId: bigint;
    lessonId: bigint;
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Skipped';
    startedAt?: Date;
    completedAt?: Date;
    timeSpent: number;
    videoProgress?: number;
    viewed: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class StudentProgress extends Model<IStudentProgress> implements IStudentProgress {
    id: bigint;
    organizationId: bigint;
    studentId: bigint;
    courseId: bigint;
    lessonId: bigint;
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Skipped';
    startedAt?: Date;
    completedAt?: Date;
    timeSpent: number;
    videoProgress?: number;
    viewed: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default StudentProgress;
//# sourceMappingURL=LMS-StudentProgress.model.d.ts.map