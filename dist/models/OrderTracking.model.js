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
    customerId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
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
        type: sequelize_1.DataTypes.ENUM('New', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'),
        defaultValue: 'New',
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Paid', 'Failed', 'Refunded'),
        defaultValue: 'Pending',
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque'),
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
        { fields: ['organizationId', 'customerId'] },
        { fields: ['orderNumber'] },
        { fields: ['orderDate'] },
        { fields: ['orderStatus'] },
    ],
});
exports.default = OrderTracking;
//# sourceMappingURL=OrderTracking.model.js.map