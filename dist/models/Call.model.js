"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Call = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Call extends sequelize_1.Model {
    static initModel(sequelize) {
        Call.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            callerUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            calleeUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            callType: { type: sequelize_1.DataTypes.ENUM('Video', 'Voice'), allowNull: false, defaultValue: 'Video' },
            status: {
                type: sequelize_1.DataTypes.ENUM('Ringing', 'Active', 'Ended', 'Missed', 'Declined'),
                allowNull: false, defaultValue: 'Ringing',
            },
            roomName: { type: sequelize_1.DataTypes.STRING(300), allowNull: false },
            conversationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            startedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            endedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            durationSeconds: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
        }, {
            sequelize, tableName: 'calls', timestamps: true,
            underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['callerUserId'], name: 'idx_calls_caller' },
                { fields: ['calleeUserId'], name: 'idx_calls_callee' },
                { fields: ['status'], name: 'idx_calls_status' },
                { fields: ['uuid'], name: 'idx_calls_uuid' },
                { fields: ['createdAt'], name: 'idx_calls_created_at' },
            ],
        });
        return Call;
    }
}
exports.Call = Call;
//# sourceMappingURL=Call.model.js.map