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
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: Department tracking for RBAC filtering',
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
        type: sequelize_1.DataTypes.ENUM('Draft', 'Processed', 'Approved', 'Paid', 'Failed', 'Closed'),
        defaultValue: 'Draft',
        comment: 'NEW: Added Closed status for finalized payroll',
    },
    totalEmployees: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    totalGrossSalary: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Maintained by database trigger from payslip records',
    },
    totalDeductions: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Maintained by database trigger from payslip records',
    },
    totalNetSalary: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Maintained by database trigger from payslip records',
    },
    totalTaxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Maintained by database trigger from payslip records',
    },
    processedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff who processed payroll',
    },
    processedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    approvedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff who approved payroll (must be different from processedBy)',
    },
    approvalDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    paidDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lockedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: 'NEW: Timestamp when payroll was locked (prevent edits)',
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: Audit trail - who created this record',
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: Audit trail - who last updated this record',
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
        { fields: ['departmentId'] },
        {
            fields: ['organizationId', 'payrollMonth'],
            name: 'idx_payroll_org_month',
        },
        {
            fields: ['organizationId', 'status', 'payrollMonth'],
            name: 'idx_payroll_status_time',
        },
    ],
});
exports.default = Payroll;
//# sourceMappingURL=IMPROVED-Payroll.model.js.map