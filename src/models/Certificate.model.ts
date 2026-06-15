import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface CertificateAttributes {
  id: bigint;
  uuid: string;
  enrollmentId: bigint;
  certificateCode: string;
  certificateName: string;
  issuedDate: Date;
  expiryDate?: Date;
  certificateUrl?: string;
  verificationCode: string;
  status: 'Issued' | 'Revoked' | 'Expired';
  revokedReason?: string;
  revokedDate?: Date;
  deletedAt?: Date;
}

interface CertificateCreationAttributes extends Optional<CertificateAttributes, 'id' | 'uuid'> {}

export class Certificate extends Model<CertificateAttributes, CertificateCreationAttributes>
  implements CertificateAttributes {
  public id!: bigint;
  public uuid!: string;
  public enrollmentId!: bigint;
  public certificateCode!: string;
  public certificateName!: string;
  public issuedDate!: Date;
  public expiryDate?: Date;
  public certificateUrl?: string;
  public verificationCode!: string;
  public status!: 'Issued' | 'Revoked' | 'Expired';
  public revokedReason?: string;
  public revokedDate?: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Certificate {
    Certificate.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        enrollmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Enrollment ID' },
        certificateCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Certificate code' },
        certificateName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Certificate name' },
        issuedDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Issue date' },
        expiryDate: { type: DataTypes.DATE, allowNull: true, comment: 'Expiry date (if applicable)' },
        certificateUrl: { type: DataTypes.TEXT, allowNull: true, comment: 'Certificate URL' },
        verificationCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Verification code' },
        status: { type: DataTypes.ENUM('Issued', 'Revoked', 'Expired'), defaultValue: 'Issued' },
        revokedReason: { type: DataTypes.TEXT, allowNull: true, comment: 'Reason if revoked' },
        revokedDate: { type: DataTypes.DATE, allowNull: true, comment: 'When revoked' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'certificates', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['enrollmentId'], name: 'idx_certificates_enrollmentId' },
          { fields: ['certificateCode'], name: 'idx_certificates_certificateCode' },
          { fields: ['verificationCode'], name: 'idx_certificates_verificationCode' },
          { fields: ['status'], name: 'idx_certificates_status' },
          { fields: ['issuedDate'], name: 'idx_certificates_issuedDate' },
          { fields: ['uuid'], name: 'idx_certificates_uuid' },
        ],
        comment: 'Training certificates'
      }
    );
    return Certificate;
  }
}
