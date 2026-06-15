"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Task extends sequelize_1.Model {
    static initModel(sequelize) {
        Task.init({
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
            projectId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to projects table',
            },
            taskCode: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: false,
                comment: 'Unique task identifier',
            },
            title: {
                type: sequelize_1.DataTypes.STRING(300),
                allowNull: false,
                comment: 'Task title',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Detailed task description',
            },
            assigneeId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Assigned staff member',
            },
            reporterId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Staff who created the task',
            },
            parentTaskId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Parent task for subtask hierarchy',
            },
            milestoneId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to milestones table',
            },
            priority: {
                type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
                defaultValue: 'Medium',
                allowNull: false,
                comment: 'Task priority',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Todo', 'InProgress', 'InReview', 'Blocked', 'Done', 'Cancelled'),
                defaultValue: 'Todo',
                allowNull: false,
                comment: 'Task status',
            },
            startDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Task start date',
            },
            dueDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Task due date',
            },
            estimatedHours: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: true,
                comment: 'Estimated hours for completion',
            },
            actualHours: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: true,
                comment: 'Actual hours spent',
            },
            progress: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100,
                },
                comment: 'Task progress percentage (0-100)',
            },
            label: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Task labels/tags',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'tasks',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['projectId'],
                    name: 'idx_tasks_projectId',
                },
                {
                    fields: ['taskCode'],
                    name: 'idx_tasks_taskCode',
                },
                {
                    fields: ['assigneeId'],
                    name: 'idx_tasks_assigneeId',
                },
                {
                    fields: ['status'],
                    name: 'idx_tasks_status',
                },
                {
                    fields: ['priority'],
                    name: 'idx_tasks_priority',
                },
                {
                    fields: ['dueDate'],
                    name: 'idx_tasks_dueDate',
                },
                {
                    fields: ['parentTaskId'],
                    name: 'idx_tasks_parentTaskId',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_tasks_uuid',
                },
            ],
            comment: 'Project tasks with dependencies and tracking',
        });
        return Task;
    }
    isOverdue() {
        if (!this.dueDate || this.status === 'Done' || this.status === 'Cancelled')
            return false;
        return new Date() > this.dueDate;
    }
    isBlocked() {
        return this.status === 'Blocked';
    }
    getBurndownPercent() {
        if (this.status === 'Done')
            return 100;
        if (this.status === 'Cancelled')
            return 0;
        return this.progress || 0;
    }
    getEfficiency() {
        if (!this.estimatedHours || !this.actualHours)
            return null;
        return (Number(this.estimatedHours) / Number(this.actualHours)) * 100;
    }
}
exports.Task = Task;
//# sourceMappingURL=Task.model.js.map