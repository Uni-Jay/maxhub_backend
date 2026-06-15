"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrollment = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Enrollment extends sequelize_1.Model {
    static initModel(sequelize) {
        Enrollment.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            courseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course ID' },
            staffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff/participant ID' },
            enrollmentDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Enrollment date' },
            completionDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Completion date' },
            status: { type: sequelize_1.DataTypes.ENUM('Enrolled', 'InProgress', 'Completed', 'Failed', 'Dropped', 'OnHold'), defaultValue: 'Enrolled' },
            progressPercentage: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, defaultValue: 0, allowNull: false, comment: 'Progress 0-100' },
            certificateId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Certificate ID' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Notes' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'enrollments', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['courseId'], name: 'idx_enrollments_courseId' },
                { fields: ['staffId'], name: 'idx_enrollments_staffId' },
                { fields: ['status'], name: 'idx_enrollments_status' },
                { fields: ['enrollmentDate'], name: 'idx_enrollments_enrollmentDate' },
                { fields: ['courseId', 'staffId'], name: 'idx_enrollments_course_staff' },
                { fields: ['uuid'], name: 'idx_enrollments_uuid' },
            ],
            comment: 'Course enrollments'
        });
        return Enrollment;
    }
}
exports.Enrollment = Enrollment;
//# sourceMappingURL=Enrollment.model.js.map