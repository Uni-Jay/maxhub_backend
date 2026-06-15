"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollPeriod = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class PayrollPeriod extends sequelize_1.Model {
    static initModel(sequelize) {
        PayrollPeriod.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                unique: true,
                allowNull: false,
            },
            periodCode: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: false,
                comment: 'Payroll period code (YYYY-MM)',
            },
            month: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                validate: { min: 1, max: 12 },
                comment: 'Month number (1-12)',
            },
            year: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                comment: 'Year',
            },
            startDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Payroll period start date',
            },
            endDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Payroll period end date',
            },
            salaryProcessDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                comment: 'Salary processing date',
            },
            bankTransferDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Date of bank transfer',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Draft', 'Processing', 'Processed', 'Approved', 'Transferred', 'Closed'),
                defaultValue: 'Draft',
                allowNull: false,
                comment: 'Payroll status',
            },
            processedBy: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'User who processed payroll',
            },
            approvedBy: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'User who approved payroll',
            },
            approvalDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Payroll approval date',
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Payroll remarks',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'payroll_periods',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                { fields: ['periodCode'], name: 'idx_payroll_periods_periodCode' },
                { fields: ['month', 'year'], name: 'idx_payroll_periods_month_year' },
                { fields: ['status'], name: 'idx_payroll_periods_status' },
                { fields: ['uuid'], name: 'idx_payroll_periods_uuid' },
            ],
            comment: 'Payroll periods and cycles',
        });
        return PayrollPeriod;
    }
    canProcess() {
        return this.status === 'Draft';
    }
    canApprove() {
        return this.status === 'Processed';
    }
}
exports.PayrollPeriod = PayrollPeriod;
//# sourceMappingURL=PayrollPeriod.model.js.map