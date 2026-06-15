"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamResult = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class ExamResult extends sequelize_1.Model {
    static initModel(sequelize) {
        ExamResult.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            examId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Exam ID' },
            enrollmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Enrollment ID' },
            attemptNumber: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Attempt number' },
            startedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'When started' },
            completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'When completed' },
            totalQuestions: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Total questions' },
            correctAnswers: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Correct answers' },
            score: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Score %' },
            passingScore: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Passing score %' },
            status: { type: sequelize_1.DataTypes.ENUM('InProgress', 'Passed', 'Failed', 'Submitted'), defaultValue: 'InProgress' },
            answers: { type: sequelize_1.DataTypes.JSON, allowNull: true, comment: 'User answers (JSON)' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Feedback/notes' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'exam_results', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['examId'], name: 'idx_exam_results_examId' },
                { fields: ['enrollmentId'], name: 'idx_exam_results_enrollmentId' },
                { fields: ['status'], name: 'idx_exam_results_status' },
                { fields: ['score'], name: 'idx_exam_results_score' },
                { fields: ['examId', 'enrollmentId'], name: 'idx_exam_results_exam_enrollment' },
                { fields: ['uuid'], name: 'idx_exam_results_uuid' },
            ],
            comment: 'Exam results/attempts'
        });
        return ExamResult;
    }
}
exports.ExamResult = ExamResult;
//# sourceMappingURL=ExamResult.model.js.map