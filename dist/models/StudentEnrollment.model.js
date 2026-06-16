"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentEnrollment = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class StudentEnrollment extends sequelize_1.Model {
    static initModel(sequelize) {
        StudentEnrollment.init({
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
            programId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            enrolledById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            enrolledAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            droppedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            dropReason: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Completed', 'Dropped', 'Pending', 'Suspended'),
                allowNull: false,
                defaultValue: 'Active',
            },
            progressPercentage: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0,
            },
            grade: { type: sequelize_1.DataTypes.STRING(10), allowNull: true },
            gradePoints: { type: sequelize_1.DataTypes.DECIMAL(4, 2), allowNull: true },
            isCertificateIssued: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            certificateIssuedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        }, {
            sequelize,
            modelName: 'StudentEnrollment',
            tableName: 'student_enrollments',
            timestamps: true,
            indexes: [
                { fields: ['studentId'] },
                { fields: ['courseId'] },
                { fields: ['programId'] },
                { fields: ['status'] },
                { unique: true, fields: ['studentId', 'courseId'] },
            ],
        });
        return StudentEnrollment;
    }
}
exports.StudentEnrollment = StudentEnrollment;
exports.default = StudentEnrollment;
//# sourceMappingURL=StudentEnrollment.model.js.map