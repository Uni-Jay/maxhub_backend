"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Department = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Department extends sequelize_1.Model {
    static initModel(sequelize) {
        Department.init({
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
                comment: 'Department code (HR, FINANCE, SALES, etc.)',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Department name',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Department purpose and responsibilities',
            },
            parentDepartmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Parent department for hierarchical structure',
            },
            headUserId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to users table for department head',
            },
            budget: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Annual department budget',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Archived'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Department operational status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'departments',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['code'],
                    name: 'idx_departments_code',
                },
                {
                    fields: ['parentDepartmentId'],
                    name: 'idx_departments_parentDepartmentId',
                },
                {
                    fields: ['headUserId'],
                    name: 'idx_departments_headUserId',
                },
                {
                    fields: ['status'],
                    name: 'idx_departments_status',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_departments_uuid',
                },
            ],
            comment: 'Organizational departments with hierarchical support',
        });
        return Department;
    }
}
exports.Department = Department;
//# sourceMappingURL=Department.model.js.map