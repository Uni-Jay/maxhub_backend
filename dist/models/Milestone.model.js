"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Milestone = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Milestone extends sequelize_1.Model {
    static initModel(sequelize) {
        Milestone.init({
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
            title: {
                type: sequelize_1.DataTypes.STRING(300),
                allowNull: false,
                comment: 'Milestone title',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Milestone details',
            },
            startDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Milestone start date',
            },
            targetDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Target completion date',
            },
            completionDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Actual completion date',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'InProgress', 'Completed', 'Cancelled', 'Delayed'),
                defaultValue: 'Pending',
                allowNull: false,
                comment: 'Milestone status',
            },
            progress: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                validate: { min: 0, max: 100 },
                comment: 'Completion percentage',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'milestones',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                { fields: ['projectId'], name: 'idx_milestones_projectId' },
                { fields: ['status'], name: 'idx_milestones_status' },
                { fields: ['targetDate'], name: 'idx_milestones_targetDate' },
                { fields: ['uuid'], name: 'idx_milestones_uuid' },
            ],
            comment: 'Project milestones',
        });
        return Milestone;
    }
    isOverdue() {
        return new Date() > this.targetDate && this.status !== 'Completed' && this.status !== 'Cancelled';
    }
    isCompleted() {
        return this.status === 'Completed';
    }
}
exports.Milestone = Milestone;
//# sourceMappingURL=Milestone.model.js.map