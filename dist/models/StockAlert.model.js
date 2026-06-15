"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockAlert = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class StockAlert extends sequelize_1.Model {
}
exports.StockAlert = StockAlert;
StockAlert.init({
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
    },
    alertType: {
        type: sequelize_1.DataTypes.ENUM('Low Stock', 'Out of Stock', 'Overstocked', 'Expired', 'Damaged'),
        allowNull: false,
    },
    currentStock: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    threshold: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Acknowledged', 'Resolved', 'Ignored'),
        defaultValue: 'Active',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        defaultValue: 'Medium',
    },
    alertDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    acknowledgedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    acknowledgedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    resolvedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    resolvedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    action: {
        type: sequelize_1.DataTypes.ENUM('Purchase Order', 'Stock Transfer', 'Write Off', 'Other'),
        allowNull: false,
    },
    actionDetails: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    notifiedTo: {
        type: sequelize_1.DataTypes.JSON,
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
    tableName: 'stock_alert',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['inventoryId'] },
        { fields: ['alertType'] },
        { fields: ['priority'] },
    ],
});
exports.default = StockAlert;
//# sourceMappingURL=StockAlert.model.js.map