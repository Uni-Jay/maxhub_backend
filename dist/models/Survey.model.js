"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Survey = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Survey extends sequelize_1.Model {
    static initModel(sequelize) {
        Survey.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            surveyCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Survey code' },
            surveyTitle: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Survey title' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            surveyType: { type: sequelize_1.DataTypes.ENUM('Employee Satisfaction', 'Customer Feedback', 'Exit Interview', 'Training Feedback', 'General', 'Other'), allowNull: false },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Active', 'Closed', 'Archived'), defaultValue: 'Draft' },
            startDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Start date' },
            endDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'End date' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            targetAudience: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Target audience' },
            responseCount: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0, comment: 'Response count' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'surveys', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['surveyCode'], name: 'idx_surveys_surveyCode' },
                { fields: ['surveyType'], name: 'idx_surveys_surveyType' },
                { fields: ['status'], name: 'idx_surveys_status' },
                { fields: ['startDate'], name: 'idx_surveys_startDate' },
                { fields: ['createdById'], name: 'idx_surveys_createdById' },
                { fields: ['uuid'], name: 'idx_surveys_uuid' },
            ],
            comment: 'Surveys'
        });
        return Survey;
    }
}
exports.Survey = Survey;
//# sourceMappingURL=Survey.model.js.map