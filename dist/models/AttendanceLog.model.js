"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceLog = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class AttendanceLog extends sequelize_1.Model {
    static initModel(sequelize) {
        AttendanceLog.init({
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
            attendanceId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to attendance table',
            },
            action: {
                type: sequelize_1.DataTypes.ENUM('CheckIn', 'CheckOut', 'Modified', 'Approved', 'Rejected', 'Cancelled'),
                allowNull: false,
                comment: 'Type of action performed',
            },
            performedBy: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'User who performed the action',
            },
            oldValues: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: 'Previous values for modifications',
            },
            newValues: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: 'New values for modifications',
            },
            ipAddress: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: true,
                comment: 'IP address from which action was performed',
            },
            userAgent: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Client user agent string',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'attendance_logs',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['attendanceId'],
                    name: 'idx_attendance_logs_attendanceId',
                },
                {
                    fields: ['performedBy'],
                    name: 'idx_attendance_logs_performedBy',
                },
                {
                    fields: ['action'],
                    name: 'idx_attendance_logs_action',
                },
                {
                    fields: ['createdAt'],
                    name: 'idx_attendance_logs_createdAt',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_attendance_logs_uuid',
                },
            ],
            comment: 'Audit trail for attendance modifications',
        });
        return AttendanceLog;
    }
}
exports.AttendanceLog = AttendanceLog;
//# sourceMappingURL=AttendanceLog.model.js.map