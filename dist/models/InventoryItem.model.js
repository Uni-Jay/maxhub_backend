"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryItem = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class InventoryItem extends sequelize_1.Model {
    static initModel(sequelize) {
        InventoryItem.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            itemCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Item code' },
            itemName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Item name' },
            categoryId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Category ID' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            sku: { type: sequelize_1.DataTypes.STRING(50), allowNull: true, unique: true, comment: 'SKU' },
            unitOfMeasure: { type: sequelize_1.DataTypes.STRING(20), allowNull: false, comment: 'Unit (pcs, kg, etc)' },
            unitCost: { type: sequelize_1.DataTypes.DECIMAL(12, 4), allowNull: false, comment: 'Unit cost' },
            reorderLevel: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Minimum stock level' },
            reorderQuantity: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Quantity to reorder' },
            status: { type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Discontinued'), defaultValue: 'Active' },
            isSerializable: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Has serial numbers' },
            isBatchable: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Has batch numbers' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'inventory_items', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['itemCode'], name: 'idx_inventory_items_itemCode' },
                { fields: ['sku'], name: 'idx_inventory_items_sku' },
                { fields: ['categoryId'], name: 'idx_inventory_items_categoryId' },
                { fields: ['status'], name: 'idx_inventory_items_status' },
                { fields: ['uuid'], name: 'idx_inventory_items_uuid' },
            ],
            comment: 'Inventory items'
        });
        return InventoryItem;
    }
}
exports.InventoryItem = InventoryItem;
//# sourceMappingURL=InventoryItem.model.js.map