import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface SessionAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  refreshToken: string;
  accessTokenHash?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  deletedAt?: Date;
}

interface SessionCreationAttributes extends Optional<SessionAttributes, 'id' | 'uuid'> {}

export class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public refreshToken!: string;
  public accessTokenHash?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public expiresAt!: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Session {
    Session.init(
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
        refreshToken: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'JWT refresh token (hashed)',
        },
        accessTokenHash: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: 'SHA256 hash of access token for reference',
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
          comment: 'Client IP address (IPv4 or IPv6)',
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Client user agent string',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Session expiry time',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp (logout)',
        },
      },
      {
        sequelize,
        tableName: 'sessions',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['userId'],
            name: 'idx_sessions_userId',
          },
          {
            fields: ['expiresAt'],
            name: 'idx_sessions_expiresAt',
          },
          {
            fields: ['uuid'],
            name: 'idx_sessions_uuid',
          },
        ],
        comment: 'User session tokens for authentication',
      }
    );

    return Session;
  }

  // Helper to check if session is valid
  public isValid(): boolean {
    return !this.deletedAt && new Date() < this.expiresAt;
  }
}