import { Model, Optional, Sequelize } from 'sequelize';
interface JobOfferAttributes {
    id: bigint;
    uuid: string;
    jobApplicationId: bigint;
    offerDate: Date;
    expectedJoiningDate: Date;
    offeredSalary: number;
    currency: string;
    offerDocument?: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Expired';
    acceptedDate?: Date;
    rejectedDate?: Date;
    notes?: string;
    createdById: bigint;
    deletedAt?: Date;
}
interface JobOfferCreationAttributes extends Optional<JobOfferAttributes, 'id' | 'uuid'> {
}
export declare class JobOffer extends Model<JobOfferAttributes, JobOfferCreationAttributes> implements JobOfferAttributes {
    id: bigint;
    uuid: string;
    jobApplicationId: bigint;
    offerDate: Date;
    expectedJoiningDate: Date;
    offeredSalary: number;
    currency: string;
    offerDocument?: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Expired';
    acceptedDate?: Date;
    rejectedDate?: Date;
    notes?: string;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof JobOffer;
}
export {};
//# sourceMappingURL=JobOffer.model.d.ts.map