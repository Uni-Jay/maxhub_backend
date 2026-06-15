"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Activity extends sequelize_1.Model {
    static initModel(sequelize) {
        Activity.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            relatedEntityType: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, comment: 'Entity type (Contact, Account, etc)' },
            relatedEntityId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Entity ID' },
            activityType: { type: sequelize_1.DataTypes.ENUM('Call', 'Email', 'Meeting', 'Task', 'Note', 'WhatsApp', 'SMS', 'Other'), allowNull: false },
            subject: { type: sequelize_1.DataTypes.STRING(300), allowNull: false, comment: 'Activity subject' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            activityDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Activity date' },
            dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Due date' },
            ownerUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Owner user ID' },
            participantIds: { type: sequelize_1.DataTypes.JSON, allowNull: true, comment: 'Participant IDs (JSON)' },
            status: { type: sequelize_1.DataTypes.ENUM('Open', 'Completed', 'Cancelled'), defaultValue: 'Open' },
            outcome: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Activity outcome' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Notes' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'activities', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['relatedEntityType'], name: 'idx_activities_relatedEntityType' },
                { fields: ['relatedEntityId'], name: 'idx_activities_relatedEntityId' },
                { fields: ['activityType'], name: 'idx_activities_activityType' },
                { fields: ['ownerUserId'], name: 'idx_activities_ownerUserId' },
                { fields: ['status'], name: 'idx_activities_status' },
                { fields: ['activityDate'], name: 'idx_activities_activityDate' },
                { fields: ['uuid'], name: 'idx_activities_uuid' },
            ],
            comment: 'CRM Activities'
        });
        return Activity;
    }
}
exports.Activity = Activity;
//# sourceMappingURL=Activity.model.js.map