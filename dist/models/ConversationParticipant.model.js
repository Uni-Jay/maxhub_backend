"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationParticipant = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class ConversationParticipant extends sequelize_1.Model {
    static initModel(sequelize) {
        ConversationParticipant.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            conversationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Conversation ID' },
            userId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'User ID' },
            role: { type: sequelize_1.DataTypes.ENUM('Admin', 'Member', 'Moderator', 'Viewer'), defaultValue: 'Member' },
            joinedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Join date' },
            lastSeenAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Last activity' },
            isMuted: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is muted' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'conversation_participants', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['conversationId'], name: 'idx_conversation_participants_conversationId' },
                { fields: ['userId'], name: 'idx_conversation_participants_userId' },
                { fields: ['role'], name: 'idx_conversation_participants_role' },
                { fields: ['conversationId', 'userId'], name: 'idx_conversation_participants_conversation_user' },
                { fields: ['uuid'], name: 'idx_conversation_participants_uuid' },
            ],
            comment: 'Conversation participants'
        });
        return ConversationParticipant;
    }
}
exports.ConversationParticipant = ConversationParticipant;
//# sourceMappingURL=ConversationParticipant.model.js.map