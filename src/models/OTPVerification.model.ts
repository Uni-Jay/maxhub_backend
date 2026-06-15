import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface OTPVerificationAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  email: string;
  phone?: string;
  otpCode: string;
  otpHash: string;
  type: '2FA' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  attempts: number;
  deletedAt?: Date;
}

interface OTPVerificationCreationAttributes extends Optional<OTPVerificationAttributes, 'id' | 'uuid' | 'attempts'> {}

export class OTPVerification extends Model<OTPVerificationAttributes, OTPVerificationCreationAttributes>
  implements OTPVerificationAttributes {
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public email!: string;
  public phone?: string;
  public otpCode!: string;
  public otpHash!: string;
  public type!: '2FA' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
  public isUsed!: boolean;
  public usedAt?: Date;
  public expiresAt!: Date;
  public attempts!: number;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof OTPVerification {
    OTPVerification.init(
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
          comment: 'Reference to users table',
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Email address for OTP delivery',
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: 'Phone number for SMS OTP',
        },
        otpCode: {
          type: DataTypes.STRING(10),
          allowNull: false,
          comment: 'Plain text OTP (only in memory during generation)',
        },
        otpHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Bcrypt hashed OTP for storage',
        },
        type: {
          type: DataTypes.ENUM('2FA', 'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION'),
          allowNull: false,
          comment: 'Type of OTP verification',
        },
        isUsed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether OTP has been used',
        },
        usedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When OTP was verified',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'OTP expiration time (typically 15 minutes)',
        },
        attempts: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 0,
          allowNull: false,
          comment: 'Failed verification attempts',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'otp_verifications',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['userId'],
            name: 'idx_otp_verifications_userId',
          },
          {
            fields: ['email'],
            name: 'idx_otp_verifications_email',
          },
          {
            fields: ['type'],
            name: 'idx_otp_verifications_type',
          },
          {
            fields: ['expiresAt'],
            name: 'idx_otp_verifications_expiresAt',
          },
          {
            fields: ['isUsed'],
            name: 'idx_otp_verifications_isUsed',
          },
        ],
        comment: 'OTP verification for 2FA, email verification, and password reset',
      }
    );

    return OTPVerification;
  }

  // Helper to check if OTP is expired
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Helper to check if OTP can be verified
  public canVerify(): boolean {
    return !this.isUsed && !this.isExpired() && this.attempts < 5;
  }
}