"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryTransaction = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class InventoryTransaction extends sequelize_1.Model {
}
exports.InventoryTransaction = InventoryTransaction;
InventoryTransaction.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    inventoryId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to inventory',
    },
    warehouseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'Which warehouse for multi-location',
    },
    transactionType: {
        type: sequelize_1.DataTypes.ENUM('In', 'Out', 'Adjustment', 'Return', 'Damage', 'Count'),
        allowNull: false,
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Can be negative for OUT/Damage',
    },
    unitCost: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Cost per unit at transaction time',
    },
    transactionAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: true,
        comment: 'quantity * unitCost',
    },
    referenceType: {
        type: sequelize_1.DataTypes.ENUM('PurchaseOrder', 'Sale', 'Order', 'Manual', 'CountAdjustment'),
        allowNull: true,
    },
    referenceId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'ID of PO/Sale/Order that triggered transaction',
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    recordedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff who recorded transaction',
    },
    recordedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'inventory_transaction',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId'] },
        { fields: ['organizationId', 'inventoryId'] },
        { fields: ['recordedAt'], name: 'idx_transaction_recorded_at' },
        { fields: ['referenceType', 'referenceId'] },
        {
            fields: ['organizationId', 'inventoryId', 'recordedAt'],
            name: 'idx_transaction_reconciliation',
        },
    ],
});
exports.default = InventoryTransaction;
//# sourceMappingURL=InventoryTransaction.model.js.map