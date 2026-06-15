"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Question extends sequelize_1.Model {
    static initModel(sequelize) {
        Question.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            examId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Exam ID' },
            questionType: { type: sequelize_1.DataTypes.ENUM('MultipleChoice', 'TrueFalse', 'ShortAnswer', 'Essay', 'Matching', 'FillBlank'), allowNull: false },
            questionText: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Question text' },
            points: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Points for this question' },
            sequence: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Question sequence' },
            options: { type: sequelize_1.DataTypes.JSON, allowNull: true, comment: 'Options for multiple choice (JSON array)' },
            correctAnswer: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Correct answer' },
            explanation: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Answer explanation' },
            difficulty: { type: sequelize_1.DataTypes.ENUM('Easy', 'Medium', 'Hard'), defaultValue: 'Medium' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Active', 'Archived'), defaultValue: 'Draft' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'questions', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['examId'], name: 'idx_questions_examId' },
                { fields: ['questionType'], name: 'idx_questions_questionType' },
                { fields: ['difficulty'], name: 'idx_questions_difficulty' },
                { fields: ['status'], name: 'idx_questions_status' },
                { fields: ['uuid'], name: 'idx_questions_uuid' },
            ],
            comment: 'Exam questions'
        });
        return Question;
    }
}
exports.Question = Question;
//# sourceMappingURL=Question.model.js.map