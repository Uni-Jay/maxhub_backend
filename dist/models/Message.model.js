"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Message extends sequelize_1.Model {
    static initModel(sequelize) {
        Message.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            conversationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Conversation ID' },
            senderUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Sender user ID' },
            messageText: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Message text' },
            messageType: { type: sequelize_1.DataTypes.ENUM('Text', 'Image', 'File', 'Link', 'Emoji', 'Mention', 'Video', 'Voice', 'Audio'), defaultValue: 'Text' },
            attachmentUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Attachment URL' },
            attachmentType: { type: sequelize_1.DataTypes.STRING(50), allowNull: true, comment: 'Attachment type' },
            attachmentName: { type: sequelize_1.DataTypes.STRING(255), allowNull: true, comment: 'Original filename' },
            attachmentSize: { type: sequelize_1.DataTypes.BIGINT, allowNull: true, comment: 'File size in bytes' },
            attachmentDuration: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, comment: 'Audio/video duration in seconds' },
            replyToMessageId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reply to message ID' },
            isEdited: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is edited' },
            editedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Edit timestamp' },
            isPinned: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is pinned' },
            reactions: { type: sequelize_1.DataTypes.JSON, allowNull: true, comment: 'Reactions (JSON)' },
            starredByUserIds: { type: sequelize_1.DataTypes.JSONB, allowNull: true, defaultValue: [], comment: 'User IDs who starred this message' },
            deletedForUserIds: { type: sequelize_1.DataTypes.JSONB, allowNull: true, defaultValue: [], comment: 'User IDs who chose "delete for me" — hidden from their view only, message still exists for everyone else' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'messages', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['conversationId'], name: 'idx_messages_conversationId' },
                { fields: ['senderUserId'], name: 'idx_messages_senderUserId' },
                { fields: ['messageType'], name: 'idx_messages_messageType' },
                { fields: ['isPinned'], name: 'idx_messages_isPinned' },
                { fields: ['createdAt'], name: 'idx_messages_createdAt' },
                { fields: ['uuid'], name: 'idx_messages_uuid' },
            ],
            comment: 'Messages'
        });
        return Message;
    }
}
exports.Message = Message;
//# sourceMappingURL=Message.model.js.map