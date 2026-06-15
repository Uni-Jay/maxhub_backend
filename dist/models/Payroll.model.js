"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payroll = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Payroll extends sequelize_1.Model {
}
exports.Payroll = Payroll;
Payroll.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    payrollMonth: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    payrollPeriodStart: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    payrollPeriodEnd: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Draft', 'Processed', 'Approved', 'Paid', 'Failed'),
        defaultValue: 'Draft',
    },
    totalEmployees: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    totalGrossSalary: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    totalDeductions: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    totalNetSalary: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    totalTaxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    processedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    approvedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    processedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    approvedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    paidDate: {
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
    tableName: 'payroll',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['payrollMonth'] },
    ],
});
exports.default = Payroll;
//# sourceMappingURL=Payroll.model.js.map