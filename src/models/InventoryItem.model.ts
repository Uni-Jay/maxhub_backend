import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface InventoryItemAttributes {
  id: bigint;
  uuid: string;
  itemCode: string;
  itemName: string;
  categoryId: bigint;
  description?: string;
  sku?: string;
  unitOfMeasure: string;
  unitCost: number;
  reorderLevel: number;
  reorderQuantity: number;
  status: 'Active' | 'Inactive' | 'Discontinued';
  isSerializable: boolean;
  isBatchable: boolean;
  deletedAt?: Date;
}

interface InventoryItemCreationAttributes extends Optional<InventoryItemAttributes, 'id' | 'uuid'> {}

export class InventoryItem extends Model<InventoryItemAttributes, InventoryItemCreationAttributes>
  implements InventoryItemAttributes {
  public id!: bigint;
  public uuid!: string;
  public itemCode!: string;
  public itemName!: string;
  public categoryId!: bigint;
  public description?: string;
  public sku?: string;
  public unitOfMeasure!: string;
  public unitCost!: number;
  public reorderLevel!: number;
  public reorderQuantity!: number;
  public status!: 'Active' | 'Inactive' | 'Discontinued';
  public isSerializable!: boolean;
  public isBatchable!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof InventoryItem {
    InventoryItem.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        itemCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Item code' },
        itemName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Item name' },
        categoryId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Category ID' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        sku: { type: DataTypes.STRING(50), allowNull: true, unique: true, comment: 'SKU' },
        unitOfMeasure: { type: DataTypes.STRING(20), allowNull: false, comment: 'Unit (pcs, kg, etc)' },
        unitCost: { type: DataTypes.DECIMAL(12, 4), allowNull: false, comment: 'Unit cost' },
        reorderLevel: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Minimum stock level' },
        reorderQuantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Quantity to reorder' },
        status: { type: DataTypes.ENUM('Active', 'Inactive', 'Discontinued'), defaultValue: 'Active' },
        isSerializable: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Has serial numbers' },
        isBatchable: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Has batch numbers' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'inventory_items', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['itemCode'], name: 'idx_inventory_items_itemCode' },
          { fields: ['sku'], name: 'idx_inventory_items_sku' },
          { fields: ['categoryId'], name: 'idx_inventory_items_categoryId' },
          { fields: ['status'], name: 'idx_inventory_items_status' },
          { fields: ['uuid'], name: 'idx_inventory_items_uuid' },
        ],
        comment: 'Inventory items'
      }
    );
    return InventoryItem;
  }
}
