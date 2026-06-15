"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryLocation = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class InventoryLocation extends sequelize_1.Model {
}
exports.InventoryLocation = InventoryLocation;
InventoryLocation.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    inventoryId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to inventory',
    },
    warehouseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to warehouse',
    },
    currentStock: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    reservedStock: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Stock allocated to orders but not yet shipped',
    },
    availableStock: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'currentStock - reservedStock',
    },
    binLocation: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        comment: 'Physical location: Rack-Shelf-Bin format',
    },
    lastCountDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: 'Last physical inventory count',
    },
    minStockLevel: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Alert when falls below this',
    },
    maxStockLevel: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Alert when exceeds this',
    },
    reorderPoint: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Automatic reorder trigger',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'inventory_location',
    timestamps: true,
    createdAt: false,
    indexes: [
        {
            fields: ['inventoryId', 'warehouseId'],
            unique: true,
            name: 'uq_inventory_location_unique',
        },
        { fields: ['organizationId', 'warehouseId'] },
        { fields: ['organizationId', 'inventoryId'] },
        {
            fields: ['organizationId', 'warehouseId', 'availableStock'],
            name: 'idx_inventory_location_reorder',
        },
    ],
});
exports.default = InventoryLocation;
//# sourceMappingURL=InventoryLocation.model.js.map