"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIConversation = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class AIConversation extends sequelize_1.Model {
    static initModel(sequelize) {
        AIConversation.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true },
            userId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            title: { type: sequelize_1.DataTypes.STRING(255), allowNull: false, defaultValue: 'New Conversation' },
            model: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: 'llama3' },
            feature: {
                type: sequelize_1.DataTypes.ENUM('chat', 'report', 'summarize', 'email', 'tasks', 'reminder'),
                allowNull: false,
                defaultValue: 'chat',
            },
            messageCount: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            tableName: 'ai_conversations',
            timestamps: true,
            paranoid: true,
            underscored: false,
            indexes: [
                { fields: ['userId'], name: 'idx_ai_conversations_userId' },
                { fields: ['feature'], name: 'idx_ai_conversations_feature' },
            ],
        });
        return AIConversation;
    }
}
exports.AIConversation = AIConversation;
//# sourceMappingURL=AIConversation.model.js.map