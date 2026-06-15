"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryStructure = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class SalaryStructure extends sequelize_1.Model {
    static initModel(sequelize) {
        SalaryStructure.init({
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
            code: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: false,
                comment: 'Salary structure code',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(150),
                allowNull: false,
                comment: 'Salary structure name',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Structure details',
            },
            departmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to departments table',
            },
            designationId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to designations table',
            },
            baseSalary: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Base salary amount',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Salary structure status',
            },
            applicableFromDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Effective from date',
            },
            applicableToDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Effective until date',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'salary_structures',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                { fields: ['code'], name: 'idx_salary_structures_code' },
                { fields: ['departmentId'], name: 'idx_salary_structures_departmentId' },
                { fields: ['designationId'], name: 'idx_salary_structures_designationId' },
                { fields: ['status'], name: 'idx_salary_structures_status' },
                { fields: ['uuid'], name: 'idx_salary_structures_uuid' },
            ],
            comment: 'Salary structure definitions',
        });
        return SalaryStructure;
    }
    isActive() {
        const today = new Date();
        return this.status === 'Active' &&
            today >= this.applicableFromDate &&
            (!this.applicableToDate || today <= this.applicableToDate);
    }
}
exports.SalaryStructure = SalaryStructure;
//# sourceMappingURL=SalaryStructure.model.js.map