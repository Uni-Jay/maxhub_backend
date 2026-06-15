"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Customer extends sequelize_1.Model {
}
exports.Customer = Customer;
Customer.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    businessName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    businessType: {
        type: sequelize_1.DataTypes.ENUM('Wholesale', 'Retail', 'Distributor', 'Individual'),
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    city: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    state: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    zipCode: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    country: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    totalPurchases: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    totalSpent: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Blacklisted', 'VIP'),
        defaultValue: 'Active',
    },
    assignedSalesRep: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    lastPurchaseDate: {
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
    tableName: 'customer',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['email'] },
        { fields: ['phone'] },
        { fields: ['assignedSalesRep'] },
    ],
});
exports.default = Customer;
//# sourceMappingURL=Customer.model.js.map