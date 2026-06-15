"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamQuestion = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ExamQuestion extends sequelize_1.Model {
}
exports.ExamQuestion = ExamQuestion;
ExamQuestion.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    examId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Exam',
    },
    questionId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Question',
    },
    sequence: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    marks: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    questionType: {
        type: sequelize_1.DataTypes.ENUM('Multiple Choice', 'True/False', 'Short Answer', 'Essay'),
        allowNull: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'exam_question',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'examId'] },
        { fields: ['questionId'] },
        { fields: ['sequence'] },
        {
            fields: ['examId', 'questionId'],
            unique: true,
            where: { deletedAt: null },
            name: 'uq_exam_question_unique',
        },
    ],
});
exports.default = ExamQuestion;
//# sourceMappingURL=CBT-ExamQuestion.model.js.map