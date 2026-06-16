"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentAttendance = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class StudentAttendance extends sequelize_1.Model {
    static initModel(sequelize) {
        StudentAttendance.init({
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
            },
            studentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            courseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            classScheduleId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            date: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
            status: {
                type: sequelize_1.DataTypes.ENUM('Present', 'Absent', 'Late', 'Excused', 'Holiday'),
                allowNull: false,
                defaultValue: 'Absent',
            },
            checkInTime: { type: sequelize_1.DataTypes.TIME, allowNull: true },
            checkOutTime: { type: sequelize_1.DataTypes.TIME, allowNull: true },
            minutesLate: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
            excuseReason: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            markedById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            markedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            modelName: 'StudentAttendance',
            tableName: 'student_attendance',
            timestamps: true,
            indexes: [
                { fields: ['studentId'] },
                { fields: ['courseId'] },
                { fields: ['date'] },
                { fields: ['status'] },
                { unique: true, fields: ['studentId', 'courseId', 'date'] },
            ],
        });
        return StudentAttendance;
    }
}
exports.StudentAttendance = StudentAttendance;
exports.default = StudentAttendance;
//# sourceMappingURL=StudentAttendance.model.js.map