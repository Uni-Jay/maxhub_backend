import { Model, Optional, Sequelize } from 'sequelize';
export type StudentStatus = 'Active' | 'Inactive' | 'Graduated' | 'Suspended' | 'Withdrawn';
export type StudentGender = 'Male' | 'Female' | 'Other';
interface StudentProfileAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    companyId: bigint;
    programId?: bigint;
    departmentId?: bigint;
    studentNumber: string;
    gender?: StudentGender;
    dateOfBirth?: Date;
    address?: string;
    state?: string;
    country?: string;
    profilePicture?: string;
    bio?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianRelationship?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    enrollmentDate?: Date;
    expectedGraduationDate?: Date;
    graduationDate?: Date;
    status: StudentStatus;
    notes?: string;
    registeredById?: bigint;
    createdAt?: Date;
    updatedAt?: Date;
}
interface StudentProfileCreationAttributes extends Optional<StudentProfileAttributes, 'id' | 'uuid' | 'status'> {
}
export declare class StudentProfile extends Model<StudentProfileAttributes, StudentProfileCreationAttributes> implements StudentProfileAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    companyId: bigint;
    programId?: bigint;
    departmentId?: bigint;
    studentNumber: string;
    gender?: StudentGender;
    dateOfBirth?: Date;
    address?: string;
    state?: string;
    country?: string;
    profilePicture?: string;
    bio?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianRelationship?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    enrollmentDate?: Date;
    expectedGraduationDate?: Date;
    graduationDate?: Date;
    status: StudentStatus;
    notes?: string;
    registeredById?: bigint;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StudentProfile;
}
export default StudentProfile;
//# sourceMappingURL=StudentProfile.model.d.ts.map