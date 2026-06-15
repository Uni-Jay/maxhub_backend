import { Model, Optional, Sequelize } from 'sequelize';
interface StaffAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    dateOfBirth: Date;
    gender?: 'Male' | 'Female' | 'Other';
    departmentId: bigint;
    designationId: bigint;
    locationId: bigint;
    reportingManagerId?: bigint;
    joiningDate: Date;
    permanentDate?: Date;
    bloodGroup?: string;
    maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
    nationality?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    status: 'Active' | 'Inactive' | 'OnLeave' | 'Suspended' | 'Resigned' | 'Retired';
    deletedAt?: Date;
}
interface StaffCreationAttributes extends Optional<StaffAttributes, 'id' | 'uuid'> {
}
export declare class Staff extends Model<StaffAttributes, StaffCreationAttributes> implements StaffAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    dateOfBirth: Date;
    gender?: 'Male' | 'Female' | 'Other';
    departmentId: bigint;
    designationId: bigint;
    locationId: bigint;
    reportingManagerId?: bigint;
    joiningDate: Date;
    permanentDate?: Date;
    bloodGroup?: string;
    maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
    nationality?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    status: 'Active' | 'Inactive' | 'OnLeave' | 'Suspended' | 'Resigned' | 'Retired';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Staff;
    getFullName(): string;
    getExperienceYears(): number;
}
export {};
//# sourceMappingURL=Staff.model.d.ts.map