"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAssignment = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class TaskAssignment extends sequelize_1.Model {
    static initModel(sequelize) {
        TaskAssignment.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                unique: true,
                defaultValue: uuid_1.v4,
            },
            taskId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'task',
                    key: 'id',
                },
            },
            projectId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'project',
                    key: 'id',
                },
            },
            assignedToStaffId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            assignedByStaffId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            assignedDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            estimatedHours: {
                type: sequelize_1.DataTypes.DECIMAL(8, 2),
                allowNull: true,
            },
            actualHours: {
                type: sequelize_1.DataTypes.DECIMAL(8, 2),
                allowNull: true,
            },
            priority: {
                type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
                allowNull: false,
                defaultValue: 'Medium',
            },
            assignmentStatus: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'Accepted', 'Declined', 'Completed'),
                allowNull: false,
                defaultValue: 'Pending',
            },
            acceptedDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            declinedDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            declinedReason: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            completedDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'task_assignment',
            tableName: 'task_assignment',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['taskId'],
                },
                {
                    fields: ['projectId'],
                },
                {
                    fields: ['assignedToStaffId'],
                },
                {
                    fields: ['assignmentStatus'],
                },
            ],
        });
        return TaskAssignment;
    }
}
exports.TaskAssignment = TaskAssignment;
//# sourceMappingURL=TaskAssignment.model.js.map