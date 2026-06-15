import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
  BelongsToGetAssociationMixin,
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface DeviceLogAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  deviceId: string;
  deviceName?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  ipAddress: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  userAgent: string;
  isVerified: boolean;
  verifiedAt?: Date;
  lastActivityAt: Date;
  isTrusted: boolean;
  deletedAt?: Date;
}

interface DeviceLogCreationAttributes
  extends Optional<
    DeviceLogAttributes,
    'id' | 'uuid' | 'isVerified' | 'lastActivityAt' | 'isTrusted'
  > {}

export class DeviceLog
  extends Model<DeviceLogAttributes, DeviceLogCreationAttributes>
  implements DeviceLogAttributes
{
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public deviceId!: string;
  public deviceName?: string;
  public deviceType!: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  public osName?: string;
  public osVersion?: string;
  public browserName?: string;
  public browserVersion?: string;
  public ipAddress!: string;
  public city?: string;
  public country?: string;
  public latitude?: number;
  public longitude?: number;
  public userAgent!: string;
  public isVerified!: boolean;
  public verifiedAt?: Date;
  public lastActivityAt!: Date;
  public isTrusted!: boolean;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getUser!: BelongsToGetAssociationMixin<any>;

  public static initModel(sequelize: Sequelize): typeof DeviceLog {
    DeviceLog.init(
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
        deviceId: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Unique device identifier (browser fingerprint)',
        },
        deviceName: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: 'User-friendly device name',
        },
        deviceType: {
          type: DataTypes.ENUM('mobile', 'desktop', 'tablet', 'unknown'),
          allowNull: false,
          defaultValue: 'unknown',
        },
        osName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Operating system name (Windows, macOS, Linux, iOS, Android)',
        },
        osVersion: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        browserName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Browser name (Chrome, Firefox, Safari, etc.)',
        },
        browserVersion: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: false,
          comment: 'IPv4 or IPv6 address',
          index: true,
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Geolocation city from IP',
        },
        country: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Geolocation country from IP',
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether device has been verified',
        },
        verifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When device was first verified',
        },
        lastActivityAt: {
          type: DataTypes.DATE,
          defaultValue: () => new Date(),
          allowNull: false,
          index: true,
          comment: 'Last activity timestamp on this device',
        },
        isTrusted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'User marked device as trusted (no 2FA required)',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'device_logs',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['userId', 'isVerified'] },
          { fields: ['userId', 'isTrusted'] },
          { fields: ['deviceId', 'userId'] },
          { fields: ['lastActivityAt'] },
        ],
        comment: 'Device tracking and verification logs',
      }
    );

    return DeviceLog;
  }
}
