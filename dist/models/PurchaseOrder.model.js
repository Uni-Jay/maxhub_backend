"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrder = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class PurchaseOrder extends sequelize_1.Model {
    static initModel(sequelize) {
        PurchaseOrder.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            poCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'PO code' },
            supplierId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Supplier ID' },
            poDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'PO date' },
            expectedDeliveryDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Expected delivery' },
            subtotal: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
            discount: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
            tax: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
            total: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total' },
            currency: { type: sequelize_1.DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Issued', 'Confirmed', 'PartiallyReceived', 'Received', 'Cancelled', 'Rejected'), defaultValue: 'Draft' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Notes' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            approvedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Approved by user ID' },
            approvedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Approval date' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'purchase_orders', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['poCode'], name: 'idx_purchase_orders_poCode' },
                { fields: ['supplierId'], name: 'idx_purchase_orders_supplierId' },
                { fields: ['status'], name: 'idx_purchase_orders_status' },
                { fields: ['expectedDeliveryDate'], name: 'idx_purchase_orders_expectedDeliveryDate' },
                { fields: ['createdById'], name: 'idx_purchase_orders_createdById' },
                { fields: ['uuid'], name: 'idx_purchase_orders_uuid' },
            ],
            comment: 'Purchase orders'
        });
        return PurchaseOrder;
    }
}
exports.PurchaseOrder = PurchaseOrder;
//# sourceMappingURL=PurchaseOrder.model.js.map