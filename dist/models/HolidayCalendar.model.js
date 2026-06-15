"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayCalendar = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class HolidayCalendar extends sequelize_1.Model {
    static initModel(sequelize) {
        HolidayCalendar.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            holidayCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Holiday code' },
            holidayName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Holiday name' },
            holidayDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Holiday date' },
            year: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, comment: 'Year' },
            type: { type: sequelize_1.DataTypes.ENUM('National', 'Regional', 'Festival', 'Company'), allowNull: false },
            isOptional: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Optional holiday' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'holiday_calendars', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['holidayCode'], name: 'idx_holiday_calendars_holidayCode' },
                { fields: ['holidayDate'], name: 'idx_holiday_calendars_holidayDate' },
                { fields: ['year'], name: 'idx_holiday_calendars_year' },
                { fields: ['type'], name: 'idx_holiday_calendars_type' },
                { fields: ['uuid'], name: 'idx_holiday_calendars_uuid' },
            ],
            comment: 'Holiday calendar'
        });
        return HolidayCalendar;
    }
}
exports.HolidayCalendar = HolidayCalendar;
//# sourceMappingURL=HolidayCalendar.model.js.map