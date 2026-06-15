import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface WarehouseAttributes {
  id: bigint;
  uuid: string;
  warehouseCode: string;
  warehouseName: string;
  locationId: bigint;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  managerUserId?: bigint;
  capacity?: number;
  isActive: boolean;
  deletedAt?: Date;
}

interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id' | 'uuid'> {}

export class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes>
  implements WarehouseAttributes {
  public id!: bigint;
  public uuid!: string;
  public warehouseCode!: string;
  public warehouseName!: string;
  public locationId!: bigint;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public managerUserId?: bigint;
  public capacity?: number;
  public isActive!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Warehouse {
    Warehouse.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        warehouseCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Warehouse code' },
        warehouseName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Warehouse name' },
        locationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Location ID' },
        address: { type: DataTypes.TEXT, allowNull: true, comment: 'Address' },
        city: { type: DataTypes.STRING(100), allowNull: true, comment: 'City' },
        state: { type: DataTypes.STRING(100), allowNull: true, comment: 'State' },
        country: { type: DataTypes.STRING(100), allowNull: true, comment: 'Country' },
        managerUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Manager user ID' },
        capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Warehouse capacity' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'warehouses', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['warehouseCode'], name: 'idx_warehouses_warehouseCode' },
          { fields: ['locationId'], name: 'idx_warehouses_locationId' },
          { fields: ['managerUserId'], name: 'idx_warehouses_managerUserId' },
          { fields: ['isActive'], name: 'idx_warehouses_isActive' },
          { fields: ['uuid'], name: 'idx_warehouses_uuid' },
        ],
        comment: 'Warehouses'
      }
    );
    return Warehouse;
  }
}
