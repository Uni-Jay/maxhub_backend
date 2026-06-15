"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockTransaction = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class StockTransaction extends sequelize_1.Model {
    static initModel(sequelize) {
        StockTransaction.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            warehouseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Warehouse ID' },
            itemId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Item ID' },
            transactionType: { type: sequelize_1.DataTypes.ENUM('In', 'Out', 'Adjustment', 'Transfer', 'Damage', 'Expired'), allowNull: false },
            quantity: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Quantity' },
            referenceDocument: { type: sequelize_1.DataTypes.STRING(50), allowNull: true, comment: 'Reference document type' },
            referenceId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reference ID' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Notes' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'stock_transactions', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['warehouseId'], name: 'idx_stock_transactions_warehouseId' },
                { fields: ['itemId'], name: 'idx_stock_transactions_itemId' },
                { fields: ['transactionType'], name: 'idx_stock_transactions_transactionType' },
                { fields: ['createdById'], name: 'idx_stock_transactions_createdById' },
                { fields: ['createdAt'], name: 'idx_stock_transactions_createdAt' },
                { fields: ['uuid'], name: 'idx_stock_transactions_uuid' },
            ],
            comment: 'Stock transactions'
        });
        return StockTransaction;
    }
}
exports.StockTransaction = StockTransaction;
//# sourceMappingURL=StockTransaction.model.js.map