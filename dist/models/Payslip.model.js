"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payslip = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Payslip extends sequelize_1.Model {
}
exports.Payslip = Payslip;
Payslip.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    staffId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    payrollId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    payslipMonth: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    baseSalary: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    allowances: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    grossSalary: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    providentFund: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    incomeTax: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    professionaltax: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    otherDeductions: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    totalDeductions: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    netSalary: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Processed', 'Paid', 'Failed'),
        defaultValue: 'Pending',
    },
    paymentDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('Bank Transfer', 'Check', 'Cash', 'Other'),
        allowNull: true,
    },
    bankDetails: {
        type: sequelize_1.DataTypes.STRING(255),
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
    tableName: 'payslip',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'staffId'] },
        { fields: ['payrollId'] },
        { fields: ['payslipMonth'] },
    ],
});
exports.default = Payslip;
//# sourceMappingURL=Payslip.model.js.map