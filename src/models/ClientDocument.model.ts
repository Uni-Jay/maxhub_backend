import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type DocumentCategory =
  | 'Passport'
  | 'Certificate'
  | 'Visa'
  | 'AdmissionLetter'
  | 'EmploymentDocument'
  | 'Contract'
  | 'IdentityDocument'
  | 'Other';

export interface ClientDocumentAttributes {
  id: bigint;
  uuid: string;
  clientId: bigint;
  documentName: string;
  category: DocumentCategory;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  version: number;
  description?: string;
  uploadedByUserId: bigint;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface ClientDocumentCreationAttributes
  extends Optional<
    ClientDocumentAttributes,
    | 'id'
    | 'uuid'
    | 'fileSize'
    | 'mimeType'
    | 'version'
    | 'description'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class ClientDocument
  extends Model<ClientDocumentAttributes, ClientDocumentCreationAttributes>
  implements ClientDocumentAttributes
{
  declare id: bigint;
  declare uuid: string;
  declare clientId: bigint;
  declare documentName: string;
  declare category: DocumentCategory;
  declare fileUrl: string;
  declare fileSize?: number;
  declare mimeType?: string;
  declare version: number;
  declare description?: string;
  declare uploadedByUserId: bigint;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;

  static initModel(sequelize: Sequelize): void {
    ClientDocument.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        clientId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        documentName: { type: DataTypes.STRING(255), allowNull: false },
        category: {
          type: DataTypes.ENUM(
            'Passport',
            'Certificate',
            'Visa',
            'AdmissionLetter',
            'EmploymentDocument',
            'Contract',
            'IdentityDocument',
            'Other'
          ),
          defaultValue: 'Other',
        },
        fileUrl: { type: DataTypes.STRING(1000), allowNull: false },
        fileSize: { type: DataTypes.INTEGER, allowNull: true },
        mimeType: { type: DataTypes.STRING(100), allowNull: true },
        version: { type: DataTypes.INTEGER, defaultValue: 1 },
        description: { type: DataTypes.TEXT, allowNull: true },
        uploadedByUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      },
      {
        sequelize,
        modelName: 'ClientDocument',
        tableName: 'client_documents',
        paranoid: true,
        timestamps: true,
      }
    );
  }
}

export default ClientDocument;
