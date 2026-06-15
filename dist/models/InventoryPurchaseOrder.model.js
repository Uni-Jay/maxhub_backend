"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryPurchaseOrder = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class InventoryPurchaseOrder extends sequelize_1.Model {
}
exports.InventoryPurchaseOrder = InventoryPurchaseOrder;
InventoryPurchaseOrder.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    supplierId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    poNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    poDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    expectedDeliveryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    actualDeliveryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    items: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    totalQuantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    subtotal: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    taxPercentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    taxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    shippingCost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    orderStatus: {
        type: sequelize_1.DataTypes.ENUM('Draft', 'Sent', 'Confirmed', 'Partial', 'Delivered', 'Cancelled'),
        defaultValue: 'Draft',
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM('Unpaid', 'Partially Paid', 'Paid'),
        defaultValue: 'Unpaid',
    },
    paymentTerms: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    deliveryAddress: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    approvedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    approvalDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
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
    tableName: 'inventory_purchase_order',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'supplierId'] },
        { fields: ['poNumber'] },
        { fields: ['orderStatus'] },
    ],
});
exports.default = InventoryPurchaseOrder;
//# sourceMappingURL=InventoryPurchaseOrder.model.js.map