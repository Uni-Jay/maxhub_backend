"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventorySupplier = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class InventorySupplier extends sequelize_1.Model {
}
exports.InventorySupplier = InventorySupplier;
InventorySupplier.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    supplierName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    contactPerson: {
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
    taxId: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    bankAccountNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    bankName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    paymentTerms: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    leadTime: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Blocked', 'Suspended'),
        defaultValue: 'Active',
    },
    ratingScore: {
        type: sequelize_1.DataTypes.DECIMAL(3, 1),
        allowNull: true,
    },
    totalOrders: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    totalSpent: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    lastOrderDate: {
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
    tableName: 'inventory_supplier',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['email'] },
        { fields: ['supplierName'] },
    ],
});
exports.default = InventorySupplier;
//# sourceMappingURL=InventorySupplier.model.js.map