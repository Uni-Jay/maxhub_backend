import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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
  whatsappNumber?: string;
  socialMediaHandle?: string;
  dateOfBirth: Date;
  gender?: 'Male' | 'Female' | 'Other';
  // Address
  homeAddress?: string;
  // Identity documents
  utilityBillDocument?: string;
  validIdType?: string;
  validIdNumber?: string;
  idDocument?: string;
  // Emergency contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyRelationship?: string;
  emergencyHomeAddress?: string;
  emergencyOfficeAddress?: string;
  // Education
  educationLevel?: string;
  degree?: string;
  institution?: string;
  major?: string;
  graduationYear?: number;
  nyscCompleted?: boolean;
  certificateDocument?: string;
  // Certification
  hasCertification?: boolean;
  certifications?: object;
  // Work history & skills
  previousWorkHistory?: object;
  skills?: object;
  // Guarantor 1
  guarantor1Name?: string;
  guarantor1Relationship?: string;
  guarantor1Phone?: string;
  guarantor1Address?: string;
  guarantor1Email?: string;
  guarantor1Occupation?: string;
  guarantor1DurationKnown?: string;
  // Guarantor 2
  guarantor2Name?: string;
  guarantor2Relationship?: string;
  guarantor2Phone?: string;
  guarantor2Address?: string;
  guarantor2Email?: string;
  guarantor2Occupation?: string;
  guarantor2DurationKnown?: string;
  // Employment details
  jobTitle?: string;
  hireDate?: Date;
  employmentStatus?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern' | 'Probation';
  // Bank details
  bankName?: string;
  accountType?: 'Savings' | 'Current';
  accountName?: string;
  accountNumber?: string;
  // Health
  hasMedicalCondition?: boolean;
  medicalConditions?: object;
  medications?: object;
  // Acknowledgment
  readJobDescription?: boolean;
  acceptedCompanyPolicy?: boolean;
  receivedCompanyAssets?: boolean;
  assignedAssets?: object;
  // Signature
  signatureImage?: string;
  signedDate?: Date;
  // Org FK fields (existing)
  departmentId: bigint;
  designationId: bigint;
  locationId: bigint;
  reportingManagerId?: bigint;
  branchId?: bigint;
  unitId?: bigint;
  // Other existing fields
  joiningDate: Date;
  permanentDate?: Date;
  bloodGroup?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  nationality?: string;
  status: 'Active' | 'Inactive' | 'OnLeave' | 'Suspended' | 'Resigned' | 'Retired';
  position?: string;
  businessUnit?: string;
  businessUnits?: string[];
  deletedAt?: Date;
}

interface StaffCreationAttributes extends Optional<StaffAttributes, 'id' | 'uuid' | 'employeeId'> {}

export class Staff extends Model<StaffAttributes, StaffCreationAttributes> implements StaffAttributes {
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public employeeId!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone!: string;
  public alternatePhone?: string;
  public whatsappNumber?: string;
  public socialMediaHandle?: string;
  public dateOfBirth!: Date;
  public gender?: 'Male' | 'Female' | 'Other';
  public homeAddress?: string;
  public utilityBillDocument?: string;
  public validIdType?: string;
  public validIdNumber?: string;
  public idDocument?: string;
  public emergencyContactName?: string;
  public emergencyContactPhone?: string;
  public emergencyRelationship?: string;
  public emergencyHomeAddress?: string;
  public emergencyOfficeAddress?: string;
  public educationLevel?: string;
  public degree?: string;
  public institution?: string;
  public major?: string;
  public graduationYear?: number;
  public nyscCompleted?: boolean;
  public certificateDocument?: string;
  public hasCertification?: boolean;
  public certifications?: object;
  public previousWorkHistory?: object;
  public skills?: object;
  public guarantor1Name?: string;
  public guarantor1Relationship?: string;
  public guarantor1Phone?: string;
  public guarantor1Address?: string;
  public guarantor1Email?: string;
  public guarantor1Occupation?: string;
  public guarantor1DurationKnown?: string;
  public guarantor2Name?: string;
  public guarantor2Relationship?: string;
  public guarantor2Phone?: string;
  public guarantor2Address?: string;
  public guarantor2Email?: string;
  public guarantor2Occupation?: string;
  public guarantor2DurationKnown?: string;
  public jobTitle?: string;
  public hireDate?: Date;
  public employmentStatus?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern' | 'Probation';
  public bankName?: string;
  public accountType?: 'Savings' | 'Current';
  public accountName?: string;
  public accountNumber?: string;
  public hasMedicalCondition?: boolean;
  public medicalConditions?: object;
  public medications?: object;
  public readJobDescription?: boolean;
  public acceptedCompanyPolicy?: boolean;
  public receivedCompanyAssets?: boolean;
  public assignedAssets?: object;
  public signatureImage?: string;
  public signedDate?: Date;
  public departmentId!: bigint;
  public designationId!: bigint;
  public locationId!: bigint;
  public reportingManagerId?: bigint;
  public branchId?: bigint;
  public unitId?: bigint;
  public joiningDate!: Date;
  public permanentDate?: Date;
  public bloodGroup?: string;
  public maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  public nationality?: string;
  public status!: 'Active' | 'Inactive' | 'OnLeave' | 'Suspended' | 'Resigned' | 'Retired';
  public position?: string;
  public businessUnit?: string;
  public businessUnits?: string[];
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Staff {
    Staff.init(
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
          unique: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          unique: true,
          comment: 'Reference to users table',
        },
        employeeId: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: true,
          comment: 'Auto-generated employee ID e.g. VM001',
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: { isEmail: true },
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        alternatePhone: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        whatsappNumber: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        socialMediaHandle: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        dateOfBirth: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        gender: {
          type: DataTypes.ENUM('Male', 'Female', 'Other'),
          allowNull: true,
        },
        homeAddress: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        utilityBillDocument: {
          type: DataTypes.STRING(500),
          allowNull: true,
          comment: 'File URL for utility bill document',
        },
        validIdType: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'e.g. NIN, Passport, Drivers License, Voters Card',
        },
        validIdNumber: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        idDocument: {
          type: DataTypes.STRING(500),
          allowNull: true,
          comment: 'File URL for ID card document',
        },
        emergencyContactName: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        emergencyContactPhone: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        emergencyRelationship: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        emergencyHomeAddress: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        emergencyOfficeAddress: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        educationLevel: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'e.g. OND, HND, BSc, MSc, PhD',
        },
        degree: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        institution: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        major: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        graduationYear: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        nyscCompleted: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        certificateDocument: {
          type: DataTypes.STRING(500),
          allowNull: true,
          comment: 'File URL for NYSC/degree certificate',
        },
        hasCertification: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        certifications: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Array of professional certifications',
        },
        previousWorkHistory: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Array of previous employers and roles',
        },
        skills: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Array of skills',
        },
        guarantor1Name: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        guarantor1Relationship: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        guarantor1Phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        guarantor1Address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        guarantor1Email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        guarantor1Occupation: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        guarantor1DurationKnown: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'How long the guarantor has known the staff member',
        },
        guarantor2Name: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        guarantor2Relationship: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        guarantor2Phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        guarantor2Address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        guarantor2Email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        guarantor2Occupation: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        guarantor2DurationKnown: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        jobTitle: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        hireDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        employmentStatus: {
          type: DataTypes.ENUM('Full-Time', 'Part-Time', 'Contract', 'Intern', 'Probation'),
          allowNull: true,
        },
        bankName: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        accountType: {
          type: DataTypes.ENUM('Savings', 'Current'),
          allowNull: true,
        },
        accountName: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        accountNumber: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        hasMedicalCondition: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        medicalConditions: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        medications: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        readJobDescription: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        acceptedCompanyPolicy: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        receivedCompanyAssets: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        assignedAssets: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of company assets assigned to staff',
        },
        signatureImage: {
          type: DataTypes.STRING(500),
          allowNull: true,
          comment: 'File URL for staff signature image',
        },
        signedDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        departmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Primary department (legacy FK)',
        },
        designationId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        locationId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        reportingManagerId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        branchId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to branches table',
        },
        unitId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to units table — primary core unit',
        },
        joiningDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        permanentDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        bloodGroup: {
          type: DataTypes.STRING(5),
          allowNull: true,
        },
        maritalStatus: {
          type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
          allowNull: true,
        },
        nationality: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'OnLeave', 'Suspended', 'Resigned', 'Retired'),
          defaultValue: 'Active',
          allowNull: false,
        },
        position: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        businessUnit: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        businessUnits: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'staff',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        hooks: {
          beforeCreate: async (staff: Staff) => {
            if (!staff.employeeId) {
              const bu = (staff.businessUnit || staff.businessUnits?.[0] || '').toLowerCase();
              let prefix = 'VM';
              if (bu.includes('beadmax') || bu.includes('bead')) prefix = 'BM';
              else if (bu.includes('kurios')) prefix = 'KS';
              const count = await Staff.count({
                where: { employeeId: { [require('sequelize').Op.iLike]: `${prefix}%` } },
                paranoid: false,
              });
              staff.employeeId = `${prefix}${String(count + 1).padStart(3, '0')}`;
            }
          },
        },
        indexes: [
          { fields: ['employeeId'], name: 'idx_staff_employeeId' },
          { fields: ['userId'], name: 'idx_staff_userId' },
          { fields: ['departmentId'], name: 'idx_staff_departmentId' },
          { fields: ['designationId'], name: 'idx_staff_designationId' },
          { fields: ['locationId'], name: 'idx_staff_locationId' },
          { fields: ['reportingManagerId'], name: 'idx_staff_reportingManagerId' },
          { fields: ['branchId'], name: 'idx_staff_branchId' },
          { fields: ['unitId'], name: 'idx_staff_unitId' },
          { fields: ['status'], name: 'idx_staff_status' },
          { fields: ['email'], name: 'idx_staff_email' },
          { fields: ['joiningDate'], name: 'idx_staff_joiningDate' },
          { fields: ['uuid'], name: 'idx_staff_uuid' },
        ],
        comment: 'Employee staff records with full onboarding profile',
      }
    );

    return Staff;
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public getExperienceYears(): number {
    const now = new Date();
    return Math.floor((now.getTime() - this.joiningDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
}
