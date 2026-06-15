import { Model, Optional, Sequelize } from 'sequelize';
interface JobPostingAttributes {
    id: bigint;
    uuid: string;
    jobCode: string;
    title: string;
    description?: string;
    departmentId: bigint;
    designationId: bigint;
    noOfPositions: number;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    location?: string;
    requiredExperience?: string;
    qualifications?: string;
    skills?: string;
    benefits?: string;
    postedDate: Date;
    closingDate: Date;
    createdById: bigint;
    status: 'Draft' | 'Open' | 'Closed' | 'OnHold' | 'Filled';
    deletedAt?: Date;
}
interface JobPostingCreationAttributes extends Optional<JobPostingAttributes, 'id' | 'uuid'> {
}
export declare class JobPosting extends Model<JobPostingAttributes, JobPostingCreationAttributes> implements JobPostingAttributes {
    id: bigint;
    uuid: string;
    jobCode: string;
    title: string;
    description?: string;
    departmentId: bigint;
    designationId: bigint;
    noOfPositions: number;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    location?: string;
    requiredExperience?: string;
    qualifications?: string;
    skills?: string;
    benefits?: string;
    postedDate: Date;
    closingDate: Date;
    createdById: bigint;
    status: 'Draft' | 'Open' | 'Closed' | 'OnHold' | 'Filled';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof JobPosting;
    isActive(): boolean;
    isClosed(): boolean;
}
export {};
//# sourceMappingURL=JobPosting.model.d.ts.map