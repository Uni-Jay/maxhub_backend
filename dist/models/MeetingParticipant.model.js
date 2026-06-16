"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingParticipant = void 0;
const sequelize_1 = require("sequelize");
class MeetingParticipant extends sequelize_1.Model {
    static initModel(sequelize) {
        MeetingParticipant.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            meetingId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            userId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            joinedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            leftAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            durationSeconds: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
            status: {
                type: sequelize_1.DataTypes.ENUM('Invited', 'Joined', 'Declined', 'NoShow'),
                allowNull: false, defaultValue: 'Invited',
            },
        }, {
            sequelize, tableName: 'meeting_participants', timestamps: true,
            underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['meetingId'], name: 'idx_mp_meeting' },
                { fields: ['userId'], name: 'idx_mp_user' },
                { fields: ['meetingId', 'userId'], name: 'idx_mp_unique', unique: true },
            ],
        });
        return MeetingParticipant;
    }
}
exports.MeetingParticipant = MeetingParticipant;
//# sourceMappingURL=MeetingParticipant.model.js.map