"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Sale extends sequelize_1.Model {
}
exports.Sale = Sale;
Sale.init({
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
    saleDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    saleNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    productCategory: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    productDetails: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    unitPrice: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    discountPercentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    discountAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    taxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    netAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    saleStatus: {
        type: sequelize_1.DataTypes.ENUM('Completed', 'Partial', 'Cancelled'),
        defaultValue: 'Completed',
    },
    paymentReceived: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    outstandingAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    salesPerson: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    paymentMode: {
        type: sequelize_1.DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque'),
        allowNull: true,
    },
    paymentDate: {
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
    tableName: 'sale',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'customerId'] },
        { fields: ['saleNumber'] },
        { fields: ['saleDate'] },
        { fields: ['saleStatus'] },
    ],
});
exports.default = Sale;
//# sourceMappingURL=Sale.model.js.map