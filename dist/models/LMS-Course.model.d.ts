import { Model } from 'sequelize';
export interface ICourse {
    id: bigint;
    organizationId: bigint;
    departmentId: bigint;
    courseCode: string;
    courseName: string;
    description?: string;
    instructorId: bigint;
    category: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    duration: number;
    maxStudents?: number;
    prerequisiteStatus: 'None' | 'Required' | 'Recommended';
    credits: number;
    status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
    enrollmentStartDate?: Date;
    enrollmentEndDate?: Date;
    courseStartDate?: Date;
    courseEndDate?: Date;
    isPublic: boolean;
    thumbnailUrl?: string;
    createdBy: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Course extends Model<ICourse> implements ICourse {
    id: bigint;
    organizationId: bigint;
    departmentId: bigint;
    courseCode: string;
    courseName: string;
    description?: string;
    instructorId: bigint;
    category: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    duration: number;
    maxStudents?: number;
    prerequisiteStatus: 'None' | 'Required' | 'Recommended';
    credits: number;
    status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
    enrollmentStartDate?: Date;
    enrollmentEndDate?: Date;
    courseStartDate?: Date;
    courseEndDate?: Date;
    isPublic: boolean;
    thumbnailUrl?: string;
    createdBy: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Course;
//# sourceMappingURL=LMS-Course.model.d.ts.map