"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderTracking = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class OrderTracking extends sequelize_1.Model {
}
exports.OrderTracking = OrderTracking;
OrderTracking.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: Department tracking for RBAC',
    },
    customerId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to customer',
    },
    orderDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    orderNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    invoiceId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: Link to generated invoice',
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    discountAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    taxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    finalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    orderStatus: {
        type: sequelize_1.DataTypes.ENUM('New', 'Confirmed', 'Processing', 'Partial', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'),
        defaultValue: 'New',
        comment: 'NEW: Added Partial status for multi-item orders',
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Partial', 'Paid', 'Failed', 'Refunded'),
        defaultValue: 'Pending',
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque', 'Digital Wallet'),
        allowNull: true,
    },
    shippingAddress: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    estimatedDeliveryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    actualDeliveryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    shippingTrackingNumber: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    totalItemsOrdered: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'NEW: For partial delivery tracking',
    },
    totalItemsDelivered: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'NEW: For partial delivery tracking',
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: Audit trail',
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: Audit trail',
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
    tableName: 'order_tracking',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'orderStatus'] },
        { fields: ['customerId'] },
        { fields: ['orderNumber'] },
        { fields: ['orderDate'] },
        { fields: ['departmentId'] },
        { fields: ['invoiceId'] },
        {
            fields: ['organizationId', 'orderDate', 'orderStatus'],
            name: 'idx_order_org_date_status',
        },
        {
            fields: ['organizationId', 'orderStatus'],
            where: { deletedAt: null },
            name: 'idx_order_active_status',
        },
    ],
});
exports.default = OrderTracking;
//# sourceMappingURL=IMPROVED-OrderTracking.model.js.map