import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface WarehouseStockAttributes {
  id: bigint;
  uuid: string;
  warehouseId: bigint;
  itemId: bigint;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastCountDate?: Date;
  lastReceivedDate?: Date;
  deletedAt?: Date;
}

interface WarehouseStockCreationAttributes extends Optional<WarehouseStockAttributes, 'id' | 'uuid'> {}

export class WarehouseStock extends Model<WarehouseStockAttributes, WarehouseStockCreationAttributes>
  implements WarehouseStockAttributes {
  public id!: bigint;
  public uuid!: string;
  public warehouseId!: bigint;
  public itemId!: bigint;
  public quantity!: number;
  public reservedQuantity!: number;
  public availableQuantity!: number;
  public lastCountDate?: Date;
  public lastReceivedDate?: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof WarehouseStock {
    WarehouseStock.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        warehouseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Warehouse ID' },
        itemId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Item ID' },
        quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: 'Total quantity' },
        reservedQuantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: 'Reserved qty' },
        availableQuantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: 'Available qty' },
        lastCountDate: { type: DataTypes.DATE, allowNull: true, comment: 'Last physical count' },
        lastReceivedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Last receipt date' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'warehouse_stocks', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['warehouseId'], name: 'idx_warehouse_stocks_warehouseId' },
          { fields: ['itemId'], name: 'idx_warehouse_stocks_itemId' },
          { fields: ['warehouseId', 'itemId'], name: 'idx_warehouse_stocks_warehouse_item' },
          { fields: ['uuid'], name: 'idx_warehouse_stocks_uuid' },
        ],
        comment: 'Warehouse stock levels'
      }
    );
    return WarehouseStock;
  }
}
