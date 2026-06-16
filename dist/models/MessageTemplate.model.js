"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageTemplate = void 0;
const sequelize_1 = require("sequelize");
class MessageTemplate extends sequelize_1.Model {
    static initModel(sequelize) {
        MessageTemplate.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, unique: true },
            name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            type: {
                type: sequelize_1.DataTypes.ENUM('Weekly', 'Birthday', 'Custom', 'Welcome', 'Reminder'),
                defaultValue: 'Custom',
            },
            subject: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
            emailContent: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            smsContent: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            whatsappContent: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
            createdByUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
        }, {
            sequelize,
            modelName: 'MessageTemplate',
            tableName: 'message_templates',
            paranoid: true,
            timestamps: true,
        });
    }
}
exports.MessageTemplate = MessageTemplate;
exports.default = MessageTemplate;
//# sourceMappingURL=MessageTemplate.model.js.map