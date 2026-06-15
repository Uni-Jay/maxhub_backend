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
            messageType: { type: sequelize_1.DataTypes.ENUM('Text', 'Image', 'File', 'Link', 'Emoji', 'Mention'), defaultValue: 'Text' },
            attachmentUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Attachment URL' },
            attachmentType: { type: sequelize_1.DataTypes.STRING(50), allowNull: true, comment: 'Attachment type' },
            replyToMessageId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reply to message ID' },
            isEdited: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is edited' },
            editedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Edit timestamp' },
            isPinned: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is pinned' },
            reactions: { type: sequelize_1.DataTypes.JSON, allowNull: true, comment: 'Reactions (JSON)' },
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