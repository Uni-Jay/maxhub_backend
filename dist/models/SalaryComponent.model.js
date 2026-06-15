"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryComponent = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class SalaryComponent extends sequelize_1.Model {
    static initModel(sequelize) {
        SalaryComponent.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            componentCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Component code' },
            componentName: { type: sequelize_1.DataTypes.STRING(150), allowNull: false, comment: 'Component name' },
            componentType: { type: sequelize_1.DataTypes.ENUM('Earning', 'Deduction', 'Tax', 'Loan'), allowNull: false },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'salary_components', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['componentCode'], name: 'idx_salary_components_componentCode' },
                { fields: ['componentType'], name: 'idx_salary_components_componentType' },
                { fields: ['isActive'], name: 'idx_salary_components_isActive' },
                { fields: ['uuid'], name: 'idx_salary_components_uuid' },
            ],
            comment: 'Salary components (earnings, deductions, taxes)'
        });
        return SalaryComponent;
    }
}
exports.SalaryComponent = SalaryComponent;
//# sourceMappingURL=SalaryComponent.model.js.map