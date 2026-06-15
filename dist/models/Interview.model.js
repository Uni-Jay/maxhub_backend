"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interview = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Interview extends sequelize_1.Model {
    static initModel(sequelize) {
        Interview.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            jobApplicationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job application ID' },
            interviewType: { type: sequelize_1.DataTypes.ENUM('Phone', 'Video', 'InPerson', 'Group', 'Technical', 'HR'), allowNull: false },
            scheduledDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Interview date' },
            scheduledTime: { type: sequelize_1.DataTypes.STRING(5), allowNull: false, comment: 'Time (HH:MM)' },
            interviewerUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Interviewer user ID' },
            location: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Location' },
            meetingLink: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Video call link' },
            status: { type: sequelize_1.DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled', 'NoShow', 'Rescheduled'), defaultValue: 'Scheduled' },
            rating: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Rating 1-5' },
            feedback: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Interviewer feedback' },
            completedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Completion date' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Internal notes' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'interviews', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['jobApplicationId'], name: 'idx_interviews_jobApplicationId' },
                { fields: ['interviewerUserId'], name: 'idx_interviews_interviewerUserId' },
                { fields: ['scheduledDate'], name: 'idx_interviews_scheduledDate' },
                { fields: ['status'], name: 'idx_interviews_status' },
                { fields: ['uuid'], name: 'idx_interviews_uuid' },
            ],
            comment: 'Job interviews'
        });
        return Interview;
    }
}
exports.Interview = Interview;
//# sourceMappingURL=Interview.model.js.map