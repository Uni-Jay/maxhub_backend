import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface InventoryCategoryAttributes {
  id: bigint;
  uuid: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  parentCategoryId?: bigint;
  isActive: boolean;
  deletedAt?: Date;
}

interface InventoryCategoryCreationAttributes extends Optional<InventoryCategoryAttributes, 'id' | 'uuid'> {}

export class InventoryCategory extends Model<InventoryCategoryAttributes, InventoryCategoryCreationAttributes>
  implements InventoryCategoryAttributes {
  public id!: bigint;
  public uuid!: string;
  public categoryCode!: string;
  public categoryName!: string;
  public description?: string;
  public parentCategoryId?: bigint;
  public isActive!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof InventoryCategory {
    InventoryCategory.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        categoryCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Category code' },
        categoryName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Category name' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        parentCategoryId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Parent category ID' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'inventory_categories', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['categoryCode'], name: 'idx_inventory_categories_categoryCode' },
          { fields: ['parentCategoryId'], name: 'idx_inventory_categories_parentCategoryId' },
          { fields: ['isActive'], name: 'idx_inventory_categories_isActive' },
          { fields: ['uuid'], name: 'idx_inventory_categories_uuid' },
        ],
        comment: 'Inventory categories'
      }
    );
    return InventoryCategory;
  }
}
