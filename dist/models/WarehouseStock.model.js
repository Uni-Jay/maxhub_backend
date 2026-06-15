"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseStock = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class WarehouseStock extends sequelize_1.Model {
    static initModel(sequelize) {
        WarehouseStock.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            warehouseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Warehouse ID' },
            itemId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Item ID' },
            quantity: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: 'Total quantity' },
            reservedQuantity: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: 'Reserved qty' },
            availableQuantity: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: 'Available qty' },
            lastCountDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Last physical count' },
            lastReceivedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Last receipt date' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'warehouse_stocks', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['warehouseId'], name: 'idx_warehouse_stocks_warehouseId' },
                { fields: ['itemId'], name: 'idx_warehouse_stocks_itemId' },
                { fields: ['warehouseId', 'itemId'], name: 'idx_warehouse_stocks_warehouse_item' },
                { fields: ['uuid'], name: 'idx_warehouse_stocks_uuid' },
            ],
            comment: 'Warehouse stock levels'
        });
        return WarehouseStock;
    }
}
exports.WarehouseStock = WarehouseStock;
//# sourceMappingURL=WarehouseStock.model.js.map