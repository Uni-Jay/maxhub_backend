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

interface StaffCreationAttributes extends Optional<StaffAttributes, 'id' | 'uuid'> {}

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
  public dateOfBirth!: Date;
  public gender?: 'Male' | 'Female' | 'Other';
  public departmentId!: bigint;
  public designationId!: bigint;
  public locationId!: bigint;
  public reportingManagerId?: bigint;
  public joiningDate!: Date;
  public permanentDate?: Date;
  public bloodGroup?: string;
  public maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  public nationality?: string;
  public emergencyContactName?: string;
  public emergencyContactPhone?: string;
  public status!: 'Active' | 'Inactive' | 'OnLeave' | 'Suspended' | 'Resigned' | 'Retired';
  public deletedAt?: Date;

  // Timestamps
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
          allowNull: false,
          comment: 'Unique employee identifier',
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Employee first name',
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Employee last name',
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: { isEmail: true },
          comment: 'Work email address',
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'Work phone number',
        },
        alternatePhone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: 'Alternate contact number',
        },
        dateOfBirth: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Employee date of birth',
        },
        gender: {
          type: DataTypes.ENUM('Male', 'Female', 'Other'),
          allowNull: true,
          comment: 'Employee gender',
        },
        departmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to departments table',
        },
        designationId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to designations table',
        },
        locationId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to locations table',
        },
        reportingManagerId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to staff table for manager hierarchy',
        },
        joiningDate: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Employee joining date',
        },
        permanentDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Date employee became permanent',
        },
        bloodGroup: {
          type: DataTypes.STRING(5),
          allowNull: true,
          comment: 'Blood group (A+, B-, etc.)',
        },
        maritalStatus: {
          type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
          allowNull: true,
          comment: 'Marital status',
        },
        nationality: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Nationality/country',
        },
        emergencyContactName: {
          type: DataTypes.STRING(200),
          allowNull: true,
          comment: 'Emergency contact name',
        },
        emergencyContactPhone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: 'Emergency contact phone',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'OnLeave', 'Suspended', 'Resigned', 'Retired'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Employee status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'staff',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['employeeId'],
            name: 'idx_staff_employeeId',
          },
          {
            fields: ['userId'],
            name: 'idx_staff_userId',
          },
          {
            fields: ['departmentId'],
            name: 'idx_staff_departmentId',
          },
          {
            fields: ['designationId'],
            name: 'idx_staff_designationId',
          },
          {
            fields: ['locationId'],
            name: 'idx_staff_locationId',
          },
          {
            fields: ['reportingManagerId'],
            name: 'idx_staff_reportingManagerId',
          },
          {
            fields: ['status'],
            name: 'idx_staff_status',
          },
          {
            fields: ['email'],
            name: 'idx_staff_email',
          },
          {
            fields: ['joiningDate'],
            name: 'idx_staff_joiningDate',
          },
          {
            fields: ['uuid'],
            name: 'idx_staff_uuid',
          },
        ],
        comment: 'Employee staff records with organizational hierarchy',
      }
    );

    return Staff;
  }

  // Helper to get full name
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Helper to get work experience in years
  public getExperienceYears(): number {
    const now = new Date();
    return Math.floor((now.getTime() - this.joiningDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
}