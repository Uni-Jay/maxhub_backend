"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingAttendance = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class TrainingAttendance extends sequelize_1.Model {
    static initModel(sequelize) {
        TrainingAttendance.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            trainingProgramId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Training program ID' },
            staffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
            attendanceDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Attendance date' },
            status: { type: sequelize_1.DataTypes.ENUM('Attended', 'Absent', 'ExcusedAbsent', 'LateArrival', 'EarlyLeaving'), allowNull: false },
            arrivalTime: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Arrival time' },
            departureTime: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Departure time' },
            feedbackRating: { type: sequelize_1.DataTypes.DECIMAL(3, 2), allowNull: true, comment: 'Rating 1-5' },
            feedbackComments: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Feedback comments' },
            certificateIssued: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Certificate issued' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'training_attendances', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['trainingProgramId'], name: 'idx_training_attendances_trainingProgramId' },
                { fields: ['staffId'], name: 'idx_training_attendances_staffId' },
                { fields: ['attendanceDate'], name: 'idx_training_attendances_attendanceDate' },
                { fields: ['status'], name: 'idx_training_attendances_status' },
                { fields: ['uuid'], name: 'idx_training_attendances_uuid' },
            ],
            comment: 'Training attendance records'
        });
        return TrainingAttendance;
    }
}
exports.TrainingAttendance = TrainingAttendance;
//# sourceMappingURL=TrainingAttendance.model.js.map