"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryCategory = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class InventoryCategory extends sequelize_1.Model {
    static initModel(sequelize) {
        InventoryCategory.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            categoryCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Category code' },
            categoryName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Category name' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            parentCategoryId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Parent category ID' },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'inventory_categories', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['categoryCode'], name: 'idx_inventory_categories_categoryCode' },
                { fields: ['parentCategoryId'], name: 'idx_inventory_categories_parentCategoryId' },
                { fields: ['isActive'], name: 'idx_inventory_categories_isActive' },
                { fields: ['uuid'], name: 'idx_inventory_categories_uuid' },
            ],
            comment: 'Inventory categories'
        });
        return InventoryCategory;
    }
}
exports.InventoryCategory = InventoryCategory;
//# sourceMappingURL=InventoryCategory.model.js.map