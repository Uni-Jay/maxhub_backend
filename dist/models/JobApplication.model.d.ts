import { Model, Optional, Sequelize } from 'sequelize';
interface JobApplicationAttributes {
    id: bigint;
    uuid: string;
    jobPostingId: bigint;
    contactId: bigint;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    resumeUrl?: string;
    coverLetterUrl?: string;
    applicationDate: Date;
    status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Interviewed' | 'Offered' | 'Withdrawn';
    source?: string;
    notes?: string;
    deletedAt?: Date;
}
interface JobApplicationCreationAttributes extends Optional<JobApplicationAttributes, 'id' | 'uuid'> {
}
export declare class JobApplication extends Model<JobApplicationAttributes, JobApplicationCreationAttributes> implements JobApplicationAttributes {
    id: bigint;
    uuid: string;
    jobPostingId: bigint;
    contactId: bigint;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    resumeUrl?: string;
    coverLetterUrl?: string;
    applicationDate: Date;
    status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Interviewed' | 'Offered' | 'Withdrawn';
    source?: string;
    notes?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof JobApplication;
}
export {};
//# sourceMappingURL=JobApplication.model.d.ts.map