"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPSTracking = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class GPSTracking extends sequelize_1.Model {
    static initModel(sequelize) {
        GPSTracking.init({
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
                allowNull: true,
                references: {
                    model: 'attendance',
                    key: 'id',
                },
            },
            latitude: {
                type: sequelize_1.DataTypes.DECIMAL(10, 8),
                allowNull: false,
            },
            longitude: {
                type: sequelize_1.DataTypes.DECIMAL(11, 8),
                allowNull: false,
            },
            accuracy: {
                type: sequelize_1.DataTypes.DECIMAL(8, 2),
                allowNull: true,
            },
            altitude: {
                type: sequelize_1.DataTypes.DECIMAL(8, 2),
                allowNull: true,
            },
            speed: {
                type: sequelize_1.DataTypes.DECIMAL(8, 2),
                allowNull: true,
            },
            heading: {
                type: sequelize_1.DataTypes.DECIMAL(6, 2),
                allowNull: true,
            },
            timestamp: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            address: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
            },
            isValidLocation: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        }, {
            sequelize,
            modelName: 'gps_tracking',
            tableName: 'gps_tracking',
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
                    fields: ['timestamp'],
                },
                {
                    fields: ['staffId', 'timestamp'],
                },
            ],
        });
        return GPSTracking;
    }
}
exports.GPSTracking = GPSTracking;
//# sourceMappingURL=GPSTracking.model.js.map