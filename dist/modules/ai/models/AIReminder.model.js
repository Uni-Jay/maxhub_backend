"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIReminder = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class AIReminder extends sequelize_1.Model {
    static initModel(sequelize) {
        AIReminder.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true },
            userId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            type: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
            title: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            message: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            urgency: {
                type: sequelize_1.DataTypes.ENUM('critical', 'high', 'normal'),
                allowNull: false,
                defaultValue: 'normal',
            },
            suggestedSendTime: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            context: { type: sequelize_1.DataTypes.JSON, allowNull: false, defaultValue: {} },
            dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            sent: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
            sentAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            model: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: 'llama3' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            tableName: 'ai_reminders',
            timestamps: true,
            paranoid: true,
            underscored: false,
            indexes: [
                { fields: ['userId'], name: 'idx_ai_reminders_userId' },
                { fields: ['sent'], name: 'idx_ai_reminders_sent' },
                { fields: ['urgency'], name: 'idx_ai_reminders_urgency' },
            ],
        });
        return AIReminder;
    }
}
exports.AIReminder = AIReminder;
//# sourceMappingURL=AIReminder.model.js.map