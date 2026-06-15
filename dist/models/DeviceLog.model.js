"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceLog = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class DeviceLog extends sequelize_1.Model {
    static initModel(sequelize) {
        DeviceLog.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                allowNull: false,
                unique: true,
                index: true,
            },
            userId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                index: true,
            },
            deviceId: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                comment: 'Unique device identifier (browser fingerprint)',
            },
            deviceName: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
                comment: 'User-friendly device name',
            },
            deviceType: {
                type: sequelize_1.DataTypes.ENUM('mobile', 'desktop', 'tablet', 'unknown'),
                allowNull: false,
                defaultValue: 'unknown',
            },
            osName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Operating system name (Windows, macOS, Linux, iOS, Android)',
            },
            osVersion: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            browserName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Browser name (Chrome, Firefox, Safari, etc.)',
            },
            browserVersion: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            ipAddress: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: false,
                comment: 'IPv4 or IPv6 address',
                index: true,
            },
            city: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Geolocation city from IP',
            },
            country: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Geolocation country from IP',
            },
            latitude: {
                type: sequelize_1.DataTypes.DECIMAL(10, 8),
                allowNull: true,
            },
            longitude: {
                type: sequelize_1.DataTypes.DECIMAL(11, 8),
                allowNull: true,
            },
            userAgent: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            isVerified: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether device has been verified',
            },
            verifiedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When device was first verified',
            },
            lastActivityAt: {
                type: sequelize_1.DataTypes.DATE,
                defaultValue: () => new Date(),
                allowNull: false,
                index: true,
                comment: 'Last activity timestamp on this device',
            },
            isTrusted: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'User marked device as trusted (no 2FA required)',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'device_logs',
            timestamps: true,
            paranoid: true,
            indexes: [
                { fields: ['userId', 'isVerified'] },
                { fields: ['userId', 'isTrusted'] },
                { fields: ['deviceId', 'userId'] },
                { fields: ['lastActivityAt'] },
            ],
            comment: 'Device tracking and verification logs',
        });
        return DeviceLog;
    }
}
exports.DeviceLog = DeviceLog;
//# sourceMappingURL=DeviceLog.model.js.map