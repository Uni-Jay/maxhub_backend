import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface QRCodeTokenAttributes {
  id: bigint;
  uuid: string;
  organizationId: bigint;
  tokenHash: string; // bcrypt hash, not plaintext
  nonce: string; // Random nonce for one-time validation
  status: 'Active' | 'Used' | 'Expired' | 'Revoked';
  generatedBy: bigint;
  generatedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  usedBy?: bigint;
  usedAtLatitude?: number;
  usedAtLongitude?: number;
  geohashAtGeneration?: string; // Where QR was generated
  geohashAtUsage?: string; // Where QR was used
  geohashValid: boolean; // Check ±5km
  usageCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface QRCodeTokenCreationAttributes extends Optional<QRCodeTokenAttributes, 'id' | 'uuid'> {}

export class QRCodeToken
  extends Model<QRCodeTokenAttributes, QRCodeTokenCreationAttributes>
  implements QRCodeTokenAttributes
{
  public id!: bigint;
  public uuid!: string;
  public organizationId!: bigint;
  public tokenHash!: string;
  public nonce!: string;
  public status!: 'Active' | 'Used' | 'Expired' | 'Revoked';
  public generatedBy!: bigint;
  public generatedAt!: Date;
  public expiresAt!: Date;
  public usedAt?: Date;
  public usedBy?: bigint;
  public usedAtLatitude?: number;
  public usedAtLongitude?: number;
  public geohashAtGeneration?: string;
  public geohashAtUsage?: string;
  public geohashValid!: boolean;
  public usageCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof QRCodeToken {
    QRCodeToken.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: uuidv4,
        },
        organizationId: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        tokenHash: {
          type: DataTypes.STRING(255), // Bcrypt hash
          allowNull: false,
        },
        nonce: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        status: {
          type: DataTypes.ENUM('Active', 'Used', 'Expired', 'Revoked'),
          allowNull: false,
          defaultValue: 'Active',
        },
        generatedBy: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        generatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        usedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        usedBy: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        usedAtLatitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
        },
        usedAtLongitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
        },
        geohashAtGeneration: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        geohashAtUsage: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        geohashValid: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        usageCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: 'qr_code_token',
        tableName: 'qr_code_token',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['organizationId', 'status', 'expiresAt'],
          },
          {
            fields: ['nonce'],
            unique: true,
          },
          {
            fields: ['usedBy', 'usedAt'],
          },
        ],
      }
    );
    return QRCodeToken;
  }
}
