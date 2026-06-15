import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface StaffQualificationCreationAttributes
  extends Optional<StaffQualificationAttributes, 'id' | 'uuid'> {}

export class StaffQualification extends Model<StaffQualificationAttributes, StaffQualificationCreationAttributes>
  implements StaffQualificationAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public qualificationType!: 'Degree' | 'Diploma' | 'Certificate' | 'License' | 'Certification';
  public qualification!: string;
  public institution!: string;
  public fieldOfStudy?: string;
  public completionDate!: Date;
  public expiryDate?: Date;
  public documentUrl?: string;
  public verificationStatus!: 'Pending' | 'Verified' | 'Rejected';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StaffQualification {
    StaffQualification.init(
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
        staffId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to staff table',
        },
        qualificationType: {
          type: DataTypes.ENUM('Degree', 'Diploma', 'Certificate', 'License', 'Certification'),
          allowNull: false,
          comment: 'Type of qualification',
        },
        qualification: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Qualification name (MBA, B.Tech, etc.)',
        },
        institution: {
          type: DataTypes.STRING(300),
          allowNull: false,
          comment: 'Institution/university name',
        },
        fieldOfStudy: {
          type: DataTypes.STRING(200),
          allowNull: true,
          comment: 'Major/field of study',
        },
        completionDate: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Qualification completion date',
        },
        expiryDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Expiry date for certifications/licenses',
        },
        documentUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL to uploaded certificate/document',
        },
        verificationStatus: {
          type: DataTypes.ENUM('Pending', 'Verified', 'Rejected'),
          defaultValue: 'Pending',
          allowNull: false,
          comment: 'HR verification status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'staff_qualifications',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['staffId'],
            name: 'idx_staff_qualifications_staffId',
          },
          {
            fields: ['qualificationType'],
            name: 'idx_staff_qualifications_qualificationType',
          },
          {
            fields: ['verificationStatus'],
            name: 'idx_staff_qualifications_verificationStatus',
          },
          {
            fields: ['uuid'],
            name: 'idx_staff_qualifications_uuid',
          },
        ],
        comment: 'Employee educational qualifications and certifications',
      }
    );

    return StaffQualification;
  }

  // Helper to check if qualification is valid/not expired
  public isValid(): boolean {
    if (!this.expiryDate) return true;
    return new Date() < this.expiryDate;
  }
}