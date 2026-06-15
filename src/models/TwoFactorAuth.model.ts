import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
  BelongsToGetAssociationMixin,
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface TwoFactorAuthAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  method: 'TOTP' | 'SMS' | 'EMAIL' | 'BACKUP_CODES';
  secret?: string;
  qrCode?: string;
  phoneNumber?: string;
  isEnabled: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  backupCodes?: string;
  backupCodesUsed?: string;
  lastUsedAt?: Date;
  deletedAt?: Date;
}

interface TwoFactorAuthCreationAttributes
  extends Optional<
    TwoFactorAuthAttributes,
    'id' | 'uuid' | 'isEnabled' | 'isVerified'
  > {}

export class TwoFactorAuth
  extends Model<TwoFactorAuthAttributes, TwoFactorAuthCreationAttributes>
  implements TwoFactorAuthAttributes
{
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public method!: 'TOTP' | 'SMS' | 'EMAIL' | 'BACKUP_CODES';
  public secret?: string;
  public qrCode?: string;
  public phoneNumber?: string;
  public isEnabled!: boolean;
  public isVerified!: boolean;
  public verifiedAt?: Date;
  public backupCodes?: string;
  public backupCodesUsed?: string;
  public lastUsedAt?: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getUser!: BelongsToGetAssociationMixin<any>;

  public static initModel(sequelize: Sequelize): typeof TwoFactorAuth {
    TwoFactorAuth.init(
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
          index: true,
        },
        userId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          index: true,
        },
        method: {
          type: DataTypes.ENUM('TOTP', 'SMS', 'EMAIL', 'BACKUP_CODES'),
          allowNull: false,
          comment: '2FA method (TOTP=authenticator app, SMS, EMAIL, BACKUP_CODES)',
        },
        secret: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Encrypted TOTP secret key',
        },
        qrCode: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'QR code image data for TOTP setup',
        },
        phoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: 'Phone number for SMS 2FA',
        },
        isEnabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          index: true,
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether 2FA setup has been verified',
        },
        verifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When 2FA was first verified',
        },
        backupCodes: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'JSON array of encrypted backup codes for recovery',
        },
        backupCodesUsed: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'JSON array of used backup code IDs',
        },
        lastUsedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Last time 2FA was verified successfully',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'two_factor_auths',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['userId', 'isEnabled'] },
          { fields: ['userId', 'method'] },
        ],
        comment: 'Two-factor authentication settings per user',
      }
    );

    return TwoFactorAuth;
  }
}
