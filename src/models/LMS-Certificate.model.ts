import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Certificate Model
 * Course completion certificates
 */
export interface ICertificate {
  id: bigint;
  organizationId: bigint;
  courseId: bigint;
  studentId: bigint;
  certificateNumber: string;
  issuanceDate: Date;
  expiryDate?: Date;
  certificateUrl?: string;
  certificateHash?: string;
  status: 'Active' | 'Revoked' | 'Expired';
  issuerName?: string;
  issuerSignature?: string;
  verificationUrl?: string;
  notes?: string;
  createdBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Certificate extends Model<ICertificate> implements ICertificate {
  declare id: bigint;
  declare organizationId: bigint;
  declare courseId: bigint;
  declare studentId: bigint;
  declare certificateNumber: string;
  declare issuanceDate: Date;
  declare expiryDate?: Date;
  declare certificateUrl?: string;
  declare certificateHash?: string;
  declare status: 'Active' | 'Revoked' | 'Expired';
  declare issuerName?: string;
  declare issuerSignature?: string;
  declare verificationUrl?: string;
  declare notes?: string;
  declare createdBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Certificate.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Course',
    },
    studentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (student)',
    },
    certificateNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    issuanceDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    certificateUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    certificateHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'SHA256 hash for verification',
    },
    status: {
      type: DataTypes.ENUM('Active', 'Revoked', 'Expired'),
      defaultValue: 'Active',
    },
    issuerName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    issuerSignature: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    verificationUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff who issued',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'certificate',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'courseId'] },
      { fields: ['studentId'] },
      { fields: ['certificateNumber'] },
      { fields: ['status'] },
      { fields: ['issuanceDate'] },
    ],
  }
);

export default Certificate;
