"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIMessage = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class AIMessage extends sequelize_1.Model {
    static initModel(sequelize) {
        AIMessage.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true },
            conversationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            role: {
                type: sequelize_1.DataTypes.ENUM('system', 'user', 'assistant'),
                allowNull: false,
            },
            content: { type: sequelize_1.DataTypes.TEXT('long'), allowNull: false },
            tokensUsed: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
        }, {
            sequelize,
            tableName: 'ai_messages',
            timestamps: true,
            underscored: false,
            indexes: [
                { fields: ['conversationId'], name: 'idx_ai_messages_conversationId' },
            ],
        });
        return AIMessage;
    }
}
exports.AIMessage = AIMessage;
//# sourceMappingURL=AIMessage.model.js.map