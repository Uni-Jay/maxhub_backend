"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shift = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Shift extends sequelize_1.Model {
    static initModel(sequelize) {
        Shift.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                unique: true,
                allowNull: false,
            },
            code: {
                type: sequelize_1.DataTypes.STRING(100),
                unique: true,
                allowNull: false,
                comment: 'Shift identifier (MORNING, EVENING, etc.)',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Shift name',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Shift details',
            },
            startTime: {
                type: sequelize_1.DataTypes.STRING(8),
                allowNull: false,
                comment: 'Shift start time (HH:MM:SS)',
            },
            endTime: {
                type: sequelize_1.DataTypes.STRING(8),
                allowNull: false,
                comment: 'Shift end time (HH:MM:SS)',
            },
            breakDuration: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                comment: 'Break duration in minutes',
            },
            workingHours: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false,
                comment: 'Total working hours per shift',
            },
            departmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Department-specific shift (if null, applies to all)',
            },
            applicableForDays: {
                type: sequelize_1.DataTypes.JSON,
                defaultValue: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                allowNull: false,
                comment: 'Days shift applies (JSON array)',
            },
            isOvernight: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether shift spans midnight',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Shift status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'shifts',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['code'],
                    name: 'idx_shifts_code',
                },
                {
                    fields: ['departmentId'],
                    name: 'idx_shifts_departmentId',
                },
                {
                    fields: ['status'],
                    name: 'idx_shifts_status',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_shifts_uuid',
                },
            ],
            comment: 'Work shifts with flexible scheduling',
        });
        return Shift;
    }
}
exports.Shift = Shift;
//# sourceMappingURL=Shift.model.js.map