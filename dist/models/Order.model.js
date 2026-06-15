"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Order extends sequelize_1.Model {
    static initModel(sequelize) {
        Order.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            orderCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Order code' },
            accountId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Account ID' },
            contactId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Contact ID' },
            orderDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Order date' },
            deliveryDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Expected delivery date' },
            subtotal: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
            discount: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
            tax: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
            total: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total amount' },
            currency: { type: sequelize_1.DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'), defaultValue: 'Draft' },
            paymentStatus: { type: sequelize_1.DataTypes.ENUM('Unpaid', 'Partial', 'Paid'), defaultValue: 'Unpaid' },
            shippingAddress: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Shipping address' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Notes' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'orders', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['orderCode'], name: 'idx_orders_orderCode' },
                { fields: ['accountId'], name: 'idx_orders_accountId' },
                { fields: ['status'], name: 'idx_orders_status' },
                { fields: ['paymentStatus'], name: 'idx_orders_paymentStatus' },
                { fields: ['orderDate'], name: 'idx_orders_orderDate' },
                { fields: ['deliveryDate'], name: 'idx_orders_deliveryDate' },
                { fields: ['createdById'], name: 'idx_orders_createdById' },
                { fields: ['uuid'], name: 'idx_orders_uuid' },
            ],
            comment: 'Sales orders'
        });
        return Order;
    }
}
exports.Order = Order;
//# sourceMappingURL=Order.model.js.map