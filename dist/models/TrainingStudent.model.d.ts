import { Model } from 'sequelize';
export interface ITrainingStudent {
    id: bigint;
    organizationId: bigint;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    trainingProgram: string;
    enrollmentDate: Date;
    completionDate?: Date;
    courseLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    trainingMode: 'Online' | 'Offline' | 'Hybrid';
    status: 'Enrolled' | 'In Progress' | 'Completed' | 'Dropped' | 'Suspended';
    assignedInstructor?: bigint;
    certificationStatus: 'Not Eligible' | 'Eligible' | 'Certified';
    performanceScore?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class TrainingStudent extends Model<ITrainingStudent> implements ITrainingStudent {
    id: bigint;
    organizationId: bigint;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    trainingProgram: string;
    enrollmentDate: Date;
    completionDate?: Date;
    courseLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    trainingMode: 'Online' | 'Offline' | 'Hybrid';
    status: 'Enrolled' | 'In Progress' | 'Completed' | 'Dropped' | 'Suspended';
    assignedInstructor?: bigint;
    certificationStatus: 'Not Eligible' | 'Eligible' | 'Certified';
    performanceScore?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default TrainingStudent;
//# sourceMappingURL=TrainingStudent.model.d.ts.map