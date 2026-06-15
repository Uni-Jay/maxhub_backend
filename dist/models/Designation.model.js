"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Designation = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Designation extends sequelize_1.Model {
    static initModel(sequelize) {
        Designation.init({
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
                type: sequelize_1.DataTypes.STRING(100),
                unique: true,
                allowNull: false,
                comment: 'Designation code (CEO, CFO, MANAGER, etc.)',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Job designation/title',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Designation responsibilities and requirements',
            },
            departmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to departments table (optional for company-wide roles)',
            },
            level: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 1,
                allowNull: false,
                comment: 'Designation level (1=Junior, 2=Mid, 3=Senior, 4=Lead, 5=Manager, etc.)',
            },
            baseSalary: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Base salary for designation',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Designation availability status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'designations',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['code'],
                    name: 'idx_designations_code',
                },
                {
                    fields: ['departmentId'],
                    name: 'idx_designations_departmentId',
                },
                {
                    fields: ['level'],
                    name: 'idx_designations_level',
                },
                {
                    fields: ['status'],
                    name: 'idx_designations_status',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_designations_uuid',
                },
            ],
            comment: 'Job designations/titles with hierarchy levels',
        });
        return Designation;
    }
}
exports.Designation = Designation;
//# sourceMappingURL=Designation.model.js.map