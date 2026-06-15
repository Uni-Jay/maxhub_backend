import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface StaffDocumentAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  documentType: 'Passport' | 'NationalID' | 'Visa' | 'DrivingLicense' | 'Insurance' | 'HealthCertificate' | 'Other';
  documentName: string;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuedBy?: string;
  documentUrl: string;
  status: 'Active' | 'Expired' | 'Archived';
  deletedAt?: Date;
}

interface StaffDocumentCreationAttributes extends Optional<StaffDocumentAttributes, 'id' | 'uuid'> {}

export class StaffDocument extends Model<StaffDocumentAttributes, StaffDocumentCreationAttributes>
  implements StaffDocumentAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public documentType!: 'Passport' | 'NationalID' | 'Visa' | 'DrivingLicense' | 'Insurance' | 'HealthCertificate' | 'Other';
  public documentName!: string;
  public documentNumber?: string;
  public issueDate?: Date;
  public expiryDate?: Date;
  public issuedBy?: string;
  public documentUrl!: string;
  public status!: 'Active' | 'Expired' | 'Archived';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StaffDocument {
    StaffDocument.init(
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
        documentType: {
          type: DataTypes.ENUM('Passport', 'NationalID', 'Visa', 'DrivingLicense', 'Insurance', 'HealthCertificate', 'Other'),
          allowNull: false,
          comment: 'Type of document',
        },
        documentName: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Display name for the document',
        },
        documentNumber: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Document reference number',
        },
        issueDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Date document was issued',
        },
        expiryDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Document expiry date',
        },
        issuedBy: {
          type: DataTypes.STRING(200),
          allowNull: true,
          comment: 'Issuing authority',
        },
        documentUrl: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'URL to uploaded document file',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Expired', 'Archived'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Document status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'staff_documents',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['staffId'],
            name: 'idx_staff_documents_staffId',
          },
          {
            fields: ['documentType'],
            name: 'idx_staff_documents_documentType',
          },
          {
            fields: ['status'],
            name: 'idx_staff_documents_status',
          },
          {
            fields: ['expiryDate'],
            name: 'idx_staff_documents_expiryDate',
          },
          {
            fields: ['uuid'],
            name: 'idx_staff_documents_uuid',
          },
        ],
        comment: 'Employee documents (passport, visa, licenses, etc.)',
      }
    );

    return StaffDocument;
  }

  // Helper to check if document is expired
  public isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  // Helper to get days until expiry
  public daysUntilExpiry(): number | null {
    if (!this.expiryDate) return null;
    const now = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((this.expiryDate.getTime() - now.getTime()) / millisecondsPerDay);
  }
}