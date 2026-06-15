"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeSalary = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class EmployeeSalary extends sequelize_1.Model {
    static initModel(sequelize) {
        EmployeeSalary.init({
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
            staffId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to staff table',
            },
            payrollPeriodId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to payroll_periods table',
            },
            baseSalary: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Base salary',
            },
            grossSalary: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Total gross salary',
            },
            netSalary: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Net salary after deductions',
            },
            totalEarnings: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Total earnings',
            },
            totalDeductions: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Total deductions',
            },
            incomeTax: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Income tax deduction',
            },
            providentFund: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Provident fund contribution',
            },
            healthInsurance: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Health insurance premium',
            },
            otherDeductions: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Other deductions',
            },
            advanceAmount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Salary advance taken',
            },
            bonus: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Bonus amount',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Draft', 'Approved', 'Processed', 'Paid', 'OnHold'),
                defaultValue: 'Draft',
                allowNull: false,
                comment: 'Salary status',
            },
            processedOn: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Date salary was processed',
            },
            paidOn: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Date salary was paid',
            },
            bankAccountNumber: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true,
                comment: 'Bank account for transfer',
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Salary remarks',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'employee_salaries',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                { fields: ['staffId'], name: 'idx_employee_salaries_staffId' },
                { fields: ['payrollPeriodId'], name: 'idx_employee_salaries_payrollPeriodId' },
                { fields: ['status'], name: 'idx_employee_salaries_status' },
                { fields: ['staffId', 'payrollPeriodId'], name: 'idx_employee_salaries_staffId_payrollPeriodId' },
                { fields: ['uuid'], name: 'idx_employee_salaries_uuid' },
            ],
            comment: 'Employee salary records',
        });
        return EmployeeSalary;
    }
    calculateDeductions() {
        let total = 0;
        if (this.incomeTax)
            total += Number(this.incomeTax);
        if (this.providentFund)
            total += Number(this.providentFund);
        if (this.healthInsurance)
            total += Number(this.healthInsurance);
        if (this.otherDeductions)
            total += Number(this.otherDeductions);
        if (this.advanceAmount)
            total += Number(this.advanceAmount);
        return total;
    }
    calculateNetSalary() {
        return Number(this.grossSalary) - this.calculateDeductions();
    }
}
exports.EmployeeSalary = EmployeeSalary;
//# sourceMappingURL=EmployeeSalary.model.js.map