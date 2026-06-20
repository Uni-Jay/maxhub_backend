"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentResult = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class StudentResult extends sequelize_1.Model {
    static initModel(sequelize) {
        StudentResult.init({
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
            courseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            examId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            assignmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            type: {
                type: sequelize_1.DataTypes.ENUM('Exam', 'Assignment', 'Quiz', 'Project', 'Practical'),
                allowNull: false,
            },
            title: { type: sequelize_1.DataTypes.STRING(300), allowNull: false },
            score: { type: sequelize_1.DataTypes.DECIMAL(8, 2), allowNull: false },
            maxScore: { type: sequelize_1.DataTypes.DECIMAL(8, 2), allowNull: false },
            percentage: { type: sequelize_1.DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
            grade: { type: sequelize_1.DataTypes.STRING(5), allowNull: false, defaultValue: 'F' },
            gradePoints: { type: sequelize_1.DataTypes.DECIMAL(4, 2), allowNull: true },
            passed: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            passMark: { type: sequelize_1.DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 50 },
            attemptNumber: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
            timeTakenMinutes: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
            feedback: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            gradedById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            gradedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            publishedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            status: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'Graded', 'Published', 'Appealed'),
                allowNull: false,
                defaultValue: 'Pending',
            },
            appealReason: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            appealReviewedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            appealReviewedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            modelName: 'StudentResult',
            tableName: 'student_results',
            timestamps: true,
            underscored: false,
            paranoid: false,
            indexes: [
                { fields: ['studentId'] },
                { fields: ['courseId'] },
                { fields: ['examId'] },
                { fields: ['status'] },
                { fields: ['type'] },
            ],
        });
        return StudentResult;
    }
}
exports.StudentResult = StudentResult;
exports.default = StudentResult;
//# sourceMappingURL=StudentResult.model.js.map