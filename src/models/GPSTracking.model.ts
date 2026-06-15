import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface GPSTrackingAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  attendanceId?: bigint;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  address?: string;
  isValidLocation: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface GPSTrackingCreationAttributes extends Optional<GPSTrackingAttributes, 'id' | 'uuid'> {}

export class GPSTracking
  extends Model<GPSTrackingAttributes, GPSTrackingCreationAttributes>
  implements GPSTrackingAttributes
{
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public attendanceId?: bigint;
  public latitude!: number;
  public longitude!: number;
  public accuracy?: number;
  public altitude?: number;
  public speed?: number;
  public heading?: number;
  public timestamp!: Date;
  public address?: string;
  public isValidLocation!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof GPSTracking {
    GPSTracking.init(
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
        staffId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        attendanceId: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'attendance',
            key: 'id',
          },
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: false,
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: false,
        },
        accuracy: {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: true,
        },
        altitude: {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: true,
        },
        speed: {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: true,
        },
        heading: {
          type: DataTypes.DECIMAL(6, 2),
          allowNull: true,
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        address: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        isValidLocation: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: 'gps_tracking',
        tableName: 'gps_tracking',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['staffId'],
          },
          {
            fields: ['attendanceId'],
          },
          {
            fields: ['timestamp'],
          },
          {
            fields: ['staffId', 'timestamp'],
          },
        ],
      }
    );
    return GPSTracking;
  }
}
