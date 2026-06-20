import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface StudentProfileCreationAttributes
  extends Optional<StudentProfileAttributes, 'id' | 'uuid' | 'status'> {}

export class StudentProfile
  extends Model<StudentProfileAttributes, StudentProfileCreationAttributes>
  implements StudentProfileAttributes
{
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public companyId!: bigint;
  public programId?: bigint;
  public departmentId?: bigint;
  public studentNumber!: string;
  public gender?: StudentGender;
  public dateOfBirth?: Date;
  public address?: string;
  public state?: string;
  public country?: string;
  public profilePicture?: string;
  public bio?: string;
  public guardianName?: string;
  public guardianPhone?: string;
  public guardianEmail?: string;
  public guardianRelationship?: string;
  public emergencyContact?: string;
  public emergencyPhone?: string;
  public enrollmentDate?: Date;
  public expectedGraduationDate?: Date;
  public graduationDate?: Date;
  public status!: StudentStatus;
  public notes?: string;
  public registeredById?: bigint;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StudentProfile {
    StudentProfile.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        uuid: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          allowNull: false,
          unique: true,
        },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
        companyId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        programId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Department/business unit (e.g. Kurios SAT) this student belongs to' },
        studentNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        gender: {
          type: DataTypes.ENUM('Male', 'Female', 'Other'),
          allowNull: true,
        },
        dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        state: { type: DataTypes.STRING(100), allowNull: true },
        country: { type: DataTypes.STRING(100), allowNull: true, defaultValue: 'Nigeria' },
        profilePicture: { type: DataTypes.STRING(500), allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        guardianName: { type: DataTypes.STRING(200), allowNull: true },
        guardianPhone: { type: DataTypes.STRING(30), allowNull: true },
        guardianEmail: { type: DataTypes.STRING(200), allowNull: true },
        guardianRelationship: { type: DataTypes.STRING(100), allowNull: true },
        emergencyContact: { type: DataTypes.STRING(200), allowNull: true },
        emergencyPhone: { type: DataTypes.STRING(30), allowNull: true },
        enrollmentDate: { type: DataTypes.DATEONLY, allowNull: true },
        expectedGraduationDate: { type: DataTypes.DATEONLY, allowNull: true },
        graduationDate: { type: DataTypes.DATEONLY, allowNull: true },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'Graduated', 'Suspended', 'Withdrawn'),
          allowNull: false,
          defaultValue: 'Active',
        },
        notes: { type: DataTypes.TEXT, allowNull: true },
        registeredById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      },
      {
        sequelize,
        modelName: 'StudentProfile',
        tableName: 'student_profiles',
        timestamps: true,
        underscored: false,
        paranoid: false,
        indexes: [
          { fields: ['userId'] },
          { fields: ['companyId'] },
          { fields: ['programId'] },
          { fields: ['departmentId'] },
          { fields: ['status'] },
          { fields: ['studentNumber'], unique: true },
        ],
      }
    );
    return StudentProfile;
  }
}

export default StudentProfile;
