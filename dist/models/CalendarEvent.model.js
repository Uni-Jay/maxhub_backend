"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEvent = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class CalendarEvent extends sequelize_1.Model {
    static initModel(sequelize) {
        CalendarEvent.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true },
            title: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            date: { type: sequelize_1.DataTypes.DATE, allowNull: false },
            endDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            type: {
                type: sequelize_1.DataTypes.ENUM('Meeting', 'Task', 'Reminder', 'Holiday', 'Other'),
                defaultValue: 'Meeting',
            },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            attendees: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            tableName: 'calendar_events',
            paranoid: true,
            timestamps: true,
            underscored: false,
            freezeTableName: true,
        });
        return CalendarEvent;
    }
}
exports.CalendarEvent = CalendarEvent;
exports.default = CalendarEvent;
//# sourceMappingURL=CalendarEvent.model.js.map