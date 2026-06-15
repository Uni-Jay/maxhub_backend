import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface EmployeeDocumentAttributes {
  id: bigint;
  uuid: string;
  documentCode: string;
  staffId: bigint;
  documentType: 'Contract' | 'Letter' | 'Agreement' | 'Certification' | 'License' | 'Insurance' | 'Other';
  documentName: string;
  documentUrl: string;
  issueDate?: Date;
  expiryDate?: Date;
  status: 'Active' | 'Expired' | 'Archived' | 'Revoked';
  description?: string;
  uploadedBy: bigint;
  deletedAt?: Date;
}

interface EmployeeDocumentCreationAttributes extends Optional<EmployeeDocumentAttributes, 'id' | 'uuid'> {}

export class EmployeeDocument extends Model<EmployeeDocumentAttributes, EmployeeDocumentCreationAttributes>
  implements EmployeeDocumentAttributes {
  public id!: bigint;
  public uuid!: string;
  public documentCode!: string;
  public staffId!: bigint;
  public documentType!: 'Contract' | 'Letter' | 'Agreement' | 'Certification' | 'License' | 'Insurance' | 'Other';
  public documentName!: string;
  public documentUrl!: string;
  public issueDate?: Date;
  public expiryDate?: Date;
  public status!: 'Active' | 'Expired' | 'Archived' | 'Revoked';
  public description?: string;
  public uploadedBy!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof EmployeeDocument {
    EmployeeDocument.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        documentCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Document code' },
        staffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
        documentType: { type: DataTypes.ENUM('Contract', 'Letter', 'Agreement', 'Certification', 'License', 'Insurance', 'Other'), allowNull: false },
        documentName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Document name' },
        documentUrl: { type: DataTypes.TEXT, allowNull: false, comment: 'Document URL/path' },
        issueDate: { type: DataTypes.DATE, allowNull: true, comment: 'Issue date' },
        expiryDate: { type: DataTypes.DATE, allowNull: true, comment: 'Expiry date' },
        status: { type: DataTypes.ENUM('Active', 'Expired', 'Archived', 'Revoked'), defaultValue: 'Active' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        uploadedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Uploaded by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'employee_documents', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['documentCode'], name: 'idx_employee_documents_documentCode' },
          { fields: ['staffId'], name: 'idx_employee_documents_staffId' },
          { fields: ['documentType'], name: 'idx_employee_documents_documentType' },
          { fields: ['status'], name: 'idx_employee_documents_status' },
          { fields: ['expiryDate'], name: 'idx_employee_documents_expiryDate' },
          { fields: ['uuid'], name: 'idx_employee_documents_uuid' },
        ],
        comment: 'Employee documents'
      }
    );
    return EmployeeDocument;
  }
}
