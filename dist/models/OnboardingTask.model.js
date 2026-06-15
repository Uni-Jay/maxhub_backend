"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingTask = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class OnboardingTask extends sequelize_1.Model {
    static initModel(sequelize) {
        OnboardingTask.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            jobOfferId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job offer ID' },
            staffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Staff ID (once hired)' },
            taskName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Task name' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Task description' },
            taskType: { type: sequelize_1.DataTypes.ENUM('Document', 'Training', 'Equipment', 'System', 'Orientation', 'Other'), allowNull: false },
            dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Task due date' },
            assignedTo: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Assigned to user ID' },
            status: { type: sequelize_1.DataTypes.ENUM('Pending', 'InProgress', 'Completed', 'Skipped'), defaultValue: 'Pending' },
            completedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Completion date' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Notes' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'onboarding_tasks', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['jobOfferId'], name: 'idx_onboarding_tasks_jobOfferId' },
                { fields: ['staffId'], name: 'idx_onboarding_tasks_staffId' },
                { fields: ['assignedTo'], name: 'idx_onboarding_tasks_assignedTo' },
                { fields: ['status'], name: 'idx_onboarding_tasks_status' },
                { fields: ['dueDate'], name: 'idx_onboarding_tasks_dueDate' },
                { fields: ['uuid'], name: 'idx_onboarding_tasks_uuid' },
            ],
            comment: 'Onboarding tasks for new hires'
        });
        return OnboardingTask;
    }
}
exports.OnboardingTask = OnboardingTask;
//# sourceMappingURL=OnboardingTask.model.js.map