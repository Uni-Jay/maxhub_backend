import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface LocationAttributes {
  id: bigint;
  uuid: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isHeadOffice: boolean;
  capacity?: number;
  status: 'Active' | 'Inactive';
  deletedAt?: Date;
}

interface LocationCreationAttributes extends Optional<LocationAttributes, 'id' | 'uuid'> {}

export class Location extends Model<LocationAttributes, LocationCreationAttributes> implements LocationAttributes {
  public id!: bigint;
  public uuid!: string;
  public code!: string;
  public name!: string;
  public address!: string;
  public city!: string;
  public state!: string;
  public country!: string;
  public postalCode!: string;
  public latitude?: number;
  public longitude?: number;
  public timezone?: string;
  public isHeadOffice!: boolean;
  public capacity?: number;
  public status!: 'Active' | 'Inactive';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Location {
    Location.init(
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
        code: {
          type: DataTypes.STRING(100),
          unique: true,
          allowNull: false,
          comment: 'Location code (HQ, NYC_OFFICE, etc.)',
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Location name',
        },
        address: {
          type: DataTypes.STRING(500),
          allowNull: false,
          comment: 'Street address',
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'City name',
        },
        state: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'State/Province',
        },
        country: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Country name',
        },
        postalCode: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'Postal/ZIP code',
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
          comment: 'Geographic latitude',
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
          comment: 'Geographic longitude',
        },
        timezone: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: 'Timezone (e.g., America/New_York)',
        },
        isHeadOffice: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether location is head office',
        },
        capacity: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          comment: 'Office capacity/seating',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Location status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'locations',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['code'],
            name: 'idx_locations_code',
          },
          {
            fields: ['city'],
            name: 'idx_locations_city',
          },
          {
            fields: ['country'],
            name: 'idx_locations_country',
          },
          {
            fields: ['isHeadOffice'],
            name: 'idx_locations_isHeadOffice',
          },
          {
            fields: ['status'],
            name: 'idx_locations_status',
          },
          {
            fields: ['uuid'],
            name: 'idx_locations_uuid',
          },
        ],
        comment: 'Office/facility locations with geographic coordinates',
      }
    );

    return Location;
  }
}