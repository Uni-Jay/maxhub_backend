"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Overtime = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Overtime extends sequelize_1.Model {
    static initModel(sequelize) {
        Overtime.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                unique: true,
                defaultValue: uuid_1.v4,
            },
            staffId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            attendanceId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'attendance',
                    key: 'id',
                },
            },
            date: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
            },
            startTime: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            endTime: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            overtimeHours: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false,
            },
            overtimeRate: {
                type: sequelize_1.DataTypes.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 1.5,
            },
            amount: {
                type: sequelize_1.DataTypes.DECIMAL(12, 2),
                allowNull: true,
            },
            reason: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
            },
            approvedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Paid'),
                allowNull: false,
                defaultValue: 'Pending',
            },
        }, {
            sequelize,
            modelName: 'overtime',
            tableName: 'overtime',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['staffId'],
                },
                {
                    fields: ['attendanceId'],
                },
                {
                    fields: ['date'],
                },
                {
                    fields: ['status'],
                },
            ],
        });
        return Overtime;
    }
}
exports.Overtime = Overtime;
//# sourceMappingURL=Overtime.model.js.map