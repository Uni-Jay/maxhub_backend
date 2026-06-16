"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIMeetingSummary = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class AIMeetingSummary extends sequelize_1.Model {
    static initModel(sequelize) {
        AIMeetingSummary.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true },
            userId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            title: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            transcript: { type: sequelize_1.DataTypes.TEXT('long'), allowNull: false },
            summary: { type: sequelize_1.DataTypes.TEXT('long'), allowNull: false },
            actionItems: { type: sequelize_1.DataTypes.JSON, allowNull: false, defaultValue: [] },
            keyDecisions: { type: sequelize_1.DataTypes.JSON, allowNull: false, defaultValue: [] },
            nextSteps: { type: sequelize_1.DataTypes.JSON, allowNull: false, defaultValue: [] },
            model: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: 'llama3' },
            participants: { type: sequelize_1.DataTypes.JSON, allowNull: true },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            tableName: 'ai_meeting_summaries',
            timestamps: true,
            paranoid: true,
            underscored: false,
            indexes: [
                { fields: ['userId'], name: 'idx_ai_meeting_userId' },
            ],
        });
        return AIMeetingSummary;
    }
}
exports.AIMeetingSummary = AIMeetingSummary;
//# sourceMappingURL=AIMeetingSummary.model.js.map