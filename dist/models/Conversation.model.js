"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Conversation extends sequelize_1.Model {
    static initModel(sequelize) {
        Conversation.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            conversationCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Conversation code' },
            title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Conversation title' },
            conversationType: { type: sequelize_1.DataTypes.ENUM('Direct', 'Group', 'Team', 'Channel'), allowNull: false },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            isArchived: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is archived' },
            lastMessageAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Last message time' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'conversations', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['conversationCode'], name: 'idx_conversations_conversationCode' },
                { fields: ['createdById'], name: 'idx_conversations_createdById' },
                { fields: ['conversationType'], name: 'idx_conversations_conversationType' },
                { fields: ['isArchived'], name: 'idx_conversations_isArchived' },
                { fields: ['lastMessageAt'], name: 'idx_conversations_lastMessageAt' },
                { fields: ['uuid'], name: 'idx_conversations_uuid' },
            ],
            comment: 'Conversations'
        });
        return Conversation;
    }
}
exports.Conversation = Conversation;
//# sourceMappingURL=Conversation.model.js.map