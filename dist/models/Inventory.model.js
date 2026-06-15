"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inventory = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Inventory extends sequelize_1.Model {
}
exports.Inventory = Inventory;
Inventory.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    warehouseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    itemName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    sku: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    itemType: {
        type: sequelize_1.DataTypes.ENUM('Bead', 'Bag', 'Material', 'Office Equipment', 'Tech Equipment', 'Other'),
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    unitOfMeasure: {
        type: sequelize_1.DataTypes.ENUM('Piece', 'Box', 'Kg', 'Meter', 'Liter', 'Pack'),
        defaultValue: 'Piece',
    },
    reorderLevel: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    reorderQuantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    currentStock: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    reservedStock: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    availableStock: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    unitCost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    totalValue: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    lastRestockDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    supplier: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Discontinued', 'Low Stock'),
        defaultValue: 'Active',
    },
    location: {
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
    tableName: 'inventory',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['sku'] },
        { fields: ['itemType'] },
        { fields: ['warehouseId'] },
    ],
});
exports.default = Inventory;
//# sourceMappingURL=Inventory.model.js.map