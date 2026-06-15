"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Attendance extends sequelize_1.Model {
    static initModel(sequelize) {
        Attendance.init({
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
            staffId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to staff table',
            },
            shiftId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to shifts table',
            },
            attendanceDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Date of attendance',
            },
            checkInTime: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Check-in timestamp',
            },
            checkOutTime: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Check-out timestamp',
            },
            checkInIpAddress: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: true,
                comment: 'IP address of check-in',
            },
            checkInLatitude: {
                type: sequelize_1.DataTypes.DECIMAL(10, 8),
                allowNull: true,
                comment: 'GPS latitude of check-in location',
            },
            checkInLongitude: {
                type: sequelize_1.DataTypes.DECIMAL(11, 8),
                allowNull: true,
                comment: 'GPS longitude of check-in location',
            },
            checkOutIpAddress: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: true,
                comment: 'IP address of check-out',
            },
            checkOutLatitude: {
                type: sequelize_1.DataTypes.DECIMAL(10, 8),
                allowNull: true,
                comment: 'GPS latitude of check-out location',
            },
            checkOutLongitude: {
                type: sequelize_1.DataTypes.DECIMAL(11, 8),
                allowNull: true,
                comment: 'GPS longitude of check-out location',
            },
            workingHours: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: true,
                comment: 'Hours worked (calculated)',
            },
            overtimeHours: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: true,
                comment: 'Overtime hours (calculated)',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Present', 'Absent', 'Late', 'HalfDay', 'OnLeave', 'Holiday', 'Weekend'),
                defaultValue: 'Absent',
                allowNull: false,
                comment: 'Attendance status',
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Admin notes or reasons for status',
            },
            approvedBy: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Manager who approved the attendance',
            },
            approvalStatus: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
                defaultValue: 'Pending',
                allowNull: false,
                comment: 'Manager approval status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'attendance',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['staffId'],
                    name: 'idx_attendance_staffId',
                },
                {
                    fields: ['attendanceDate'],
                    name: 'idx_attendance_attendanceDate',
                },
                {
                    fields: ['staffId', 'attendanceDate'],
                    unique: true,
                    name: 'idx_attendance_staffId_attendanceDate_unique',
                },
                {
                    fields: ['status'],
                    name: 'idx_attendance_status',
                },
                {
                    fields: ['approvalStatus'],
                    name: 'idx_attendance_approvalStatus',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_attendance_uuid',
                },
            ],
            comment: 'Daily attendance tracking with GPS geolocation',
        });
        return Attendance;
    }
    calculateWorkingHours(shiftHours) {
        if (!this.checkInTime || !this.checkOutTime)
            return 0;
        const minutes = (this.checkOutTime.getTime() - this.checkInTime.getTime()) / (1000 * 60);
        return minutes / 60;
    }
    isLate(shiftStartTime) {
        if (!this.checkInTime)
            return true;
        return this.checkInTime > shiftStartTime;
    }
}
exports.Attendance = Attendance;
//# sourceMappingURL=Attendance.model.js.map