"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamAnswer = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ExamAnswer extends sequelize_1.Model {
}
exports.ExamAnswer = ExamAnswer;
ExamAnswer.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    examAttemptId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to StudentExamAttempt',
    },
    questionId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Question',
    },
    questionText: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: false,
    },
    marksAllocated: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    studentAnswer: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    isCorrect: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    marksObtained: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
    },
    autoGraded: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    manualGradedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff (instructor)',
    },
    manualGradedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    manualFeedback: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    sequence: {
        type: sequelize_1.DataTypes.INTEGER,
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
    tableName: 'exam_answer',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'examAttemptId'] },
        { fields: ['questionId'] },
        { fields: ['isCorrect'] },
        { fields: ['autoGraded'] },
        { fields: ['examAttemptId', 'questionId'] },
    ],
});
exports.default = ExamAnswer;
//# sourceMappingURL=CBT-ExamAnswer.model.js.map