"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffDepartment = void 0;
const sequelize_1 = require("sequelize");
class StaffDepartment extends sequelize_1.Model {
    static initModel(sequelize) {
        StaffDepartment.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            staffId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to staff table',
            },
            departmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to departments table',
            },
            isPrimary: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether this is the primary department for the staff member',
            },
            assignedAt: {
                type: sequelize_1.DataTypes.DATE,
                defaultValue: sequelize_1.DataTypes.NOW,
                allowNull: false,
                comment: 'Date when staff was assigned to this department',
            },
        }, {
            sequelize,
            tableName: 'staff_departments',
            timestamps: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    unique: true,
                    fields: ['staffId', 'departmentId'],
                    name: 'idx_staff_departments_unique',
                },
                {
                    fields: ['staffId'],
                    name: 'idx_staff_departments_staffId',
                },
                {
                    fields: ['departmentId'],
                    name: 'idx_staff_departments_departmentId',
                },
                {
                    fields: ['isPrimary'],
                    name: 'idx_staff_departments_isPrimary',
                },
            ],
            comment: 'Many-to-many junction: staff can belong to multiple departments',
        });
        return StaffDepartment;
    }
}
exports.StaffDepartment = StaffDepartment;
//# sourceMappingURL=StaffDepartment.model.js.map