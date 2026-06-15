"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Revenue = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Revenue extends sequelize_1.Model {
}
exports.Revenue = Revenue;
Revenue.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    revenueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    revenueSource: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.ENUM('Sales', 'Service', 'Investment', 'Other Income', 'Rental'),
        defaultValue: 'Sales',
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    referenceNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque'),
        defaultValue: 'Transfer',
    },
    invoiceNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    clientName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    recordedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    approvedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    approvalStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
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
    tableName: 'revenue',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'revenueDate'] },
        { fields: ['category'] },
        { fields: ['approvalStatus'] },
    ],
});
exports.default = Revenue;
//# sourceMappingURL=Revenue.model.js.map