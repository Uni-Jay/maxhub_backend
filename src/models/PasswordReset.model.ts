import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
  BelongsToGetAssociationMixin,
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface PasswordResetAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  email: string;
  token: string;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  deletedAt?: Date;
}

interface PasswordResetCreationAttributes
  extends Optional<PasswordResetAttributes, 'id' | 'uuid' | 'isUsed'> {}

export class PasswordReset
  extends Model<PasswordResetAttributes, PasswordResetCreationAttributes>
  implements PasswordResetAttributes
{
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public email!: string;
  public token!: string;
  public tokenHash!: string;
  public ipAddress?: string;
  public userAgent?: string;
  public isUsed!: boolean;
  public usedAt?: Date;
  public expiresAt!: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getUser!: BelongsToGetAssociationMixin<any>;

  public static initModel(sequelize: Sequelize): typeof PasswordReset {
    PasswordReset.init(
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
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Email address for password reset verification',
        },
        token: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'Plain reset token (only in memory during generation)',
        },
        tokenHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'SHA256 hashed token for storage',
          unique: true,
          index: true,
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
          comment: 'IP address that requested the reset',
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'User agent of the reset request',
        },
        isUsed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          index: true,
          comment: 'Whether reset token has been used',
        },
        usedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When reset token was used',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          index: true,
          comment: 'Token expiration timestamp',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'password_resets',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['userId', 'isUsed'] },
          { fields: ['email', 'expiresAt'] },
          { fields: ['tokenHash'] },
        ],
        comment: 'Password reset token management',
      }
    );

    return PasswordReset;
  }
}
