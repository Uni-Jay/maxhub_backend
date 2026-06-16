"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffQuery = void 0;
const sequelize_1 = require("sequelize");
class StaffQuery extends sequelize_1.Model {
    static initModel(sequelize) {
        StaffQuery.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, unique: true },
            title: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            priority: {
                type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
                defaultValue: 'Medium',
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('Query', 'Complaint', 'Task', 'Issue', 'Request'),
                defaultValue: 'Query',
            },
            departmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            assignedStaffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            createdByUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            status: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'InProgress', 'Resolved', 'Closed'),
                defaultValue: 'Pending',
            },
            dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            resolvedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            closedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            attachments: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        }, {
            sequelize,
            modelName: 'StaffQuery',
            tableName: 'staff_queries',
            paranoid: true,
            timestamps: true,
        });
    }
}
exports.StaffQuery = StaffQuery;
exports.default = StaffQuery;
//# sourceMappingURL=StaffQuery.model.js.map