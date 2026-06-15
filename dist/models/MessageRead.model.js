"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRead = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class MessageRead extends sequelize_1.Model {
    static initModel(sequelize) {
        MessageRead.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            messageId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Message ID' },
            userId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'User ID who read' },
            readAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Read timestamp' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'message_reads', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['messageId'], name: 'idx_message_reads_messageId' },
                { fields: ['userId'], name: 'idx_message_reads_userId' },
                { fields: ['messageId', 'userId'], name: 'idx_message_reads_message_user' },
                { fields: ['uuid'], name: 'idx_message_reads_uuid' },
            ],
            comment: 'Message read receipts'
        });
        return MessageRead;
    }
}
exports.MessageRead = MessageRead;
//# sourceMappingURL=MessageRead.model.js.map