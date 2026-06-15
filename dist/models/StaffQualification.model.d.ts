import { Model, Optional, Sequelize } from 'sequelize';
interface StaffQualificationAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    qualificationType: 'Degree' | 'Diploma' | 'Certificate' | 'License' | 'Certification';
    qualification: string;
    institution: string;
    fieldOfStudy?: string;
    completionDate: Date;
    expiryDate?: Date;
    documentUrl?: string;
    verificationStatus: 'Pending' | 'Verified' | 'Rejected';
    deletedAt?: Date;
}
interface StaffQualificationCreationAttributes extends Optional<StaffQualificationAttributes, 'id' | 'uuid'> {
}
export declare class StaffQualification extends Model<StaffQualificationAttributes, StaffQualificationCreationAttributes> implements StaffQualificationAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    qualificationType: 'Degree' | 'Diploma' | 'Certificate' | 'License' | 'Certification';
    qualification: string;
    institution: string;
    fieldOfStudy?: string;
    completionDate: Date;
    expiryDate?: Date;
    documentUrl?: string;
    verificationStatus: 'Pending' | 'Verified' | 'Rejected';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StaffQualification;
    isValid(): boolean;
}
export {};
//# sourceMappingURL=StaffQualification.model.d.ts.map