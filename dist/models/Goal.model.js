"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Goal = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Goal extends sequelize_1.Model {
    static initModel(sequelize) {
        Goal.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            goalCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Goal code' },
            staffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
            goalTitle: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Goal title' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            objectiveCategory: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, comment: 'Category' },
            targetValue: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: true, comment: 'Target value' },
            actualValue: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: true, comment: 'Actual value' },
            progress: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: 'Progress (%)', validate: { min: 0, max: 100 } },
            status: { type: sequelize_1.DataTypes.ENUM('NotStarted', 'InProgress', 'Completed', 'OnHold', 'Cancelled'), defaultValue: 'NotStarted' },
            startDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Start date' },
            targetDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Target date' },
            completedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Completion date' },
            comments: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Comments' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'goals', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['goalCode'], name: 'idx_goals_goalCode' },
                { fields: ['staffId'], name: 'idx_goals_staffId' },
                { fields: ['status'], name: 'idx_goals_status' },
                { fields: ['targetDate'], name: 'idx_goals_targetDate' },
                { fields: ['uuid'], name: 'idx_goals_uuid' },
            ],
            comment: 'Staff goals and objectives'
        });
        return Goal;
    }
}
exports.Goal = Goal;
//# sourceMappingURL=Goal.model.js.map