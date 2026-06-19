"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meeting = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Meeting extends sequelize_1.Model {
    static initModel(sequelize) {
        Meeting.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            meetingCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
            title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            meetingType: {
                type: sequelize_1.DataTypes.ENUM('Group', 'Department', 'Classroom', 'Interview', 'Training'),
                allowNull: false, defaultValue: 'Group',
            },
            roomName: { type: sequelize_1.DataTypes.STRING(300), allowNull: false },
            meetingLink: { type: sequelize_1.DataTypes.STRING(500), allowNull: false, comment: 'Google Meet URL — provided by the host when scheduling' },
            hostUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            scheduledAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            durationMinutes: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 60 },
            status: {
                type: sequelize_1.DataTypes.ENUM('Scheduled', 'Live', 'Ended', 'Cancelled'),
                allowNull: false, defaultValue: 'Scheduled',
            },
            maxParticipants: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
            isRecurring: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: true },
            recordingUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            cloudinaryPublicId: { type: sequelize_1.DataTypes.STRING(300), allowNull: true },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize, tableName: 'meetings', timestamps: true, paranoid: true,
            underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['meetingCode'], name: 'idx_meetings_code' },
                { fields: ['hostUserId'], name: 'idx_meetings_host' },
                { fields: ['status'], name: 'idx_meetings_status' },
                { fields: ['scheduledAt'], name: 'idx_meetings_scheduled_at' },
                { fields: ['uuid'], name: 'idx_meetings_uuid' },
            ],
        });
        return Meeting;
    }
}
exports.Meeting = Meeting;
//# sourceMappingURL=Meeting.model.js.map