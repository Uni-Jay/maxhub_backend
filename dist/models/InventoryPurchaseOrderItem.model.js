"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryPurchaseOrderItem = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class InventoryPurchaseOrderItem extends sequelize_1.Model {
}
exports.InventoryPurchaseOrderItem = InventoryPurchaseOrderItem;
InventoryPurchaseOrderItem.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    purchaseOrderId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to inventory_purchase_order',
    },
    inventoryId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to inventory',
    },
    lineNumber: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Ordered quantity',
    },
    unitPrice: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'quantity * unitPrice',
    },
    receivedQuantity: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Tracks partial receipt',
    },
    damagedQuantity: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Damaged items on receipt',
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
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
    tableName: 'inventory_purchase_order_item',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'purchaseOrderId'] },
        { fields: ['inventoryId'] },
        { fields: ['purchaseOrderId', 'lineNumber'] },
        {
            fields: ['purchaseOrderId'],
            where: { deletedAt: null },
        },
    ],
});
exports.default = InventoryPurchaseOrderItem;
//# sourceMappingURL=InventoryPurchaseOrderItem.model.js.map