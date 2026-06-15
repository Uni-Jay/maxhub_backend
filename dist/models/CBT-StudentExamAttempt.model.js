"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentExamAttempt = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class StudentExamAttempt extends sequelize_1.Model {
}
exports.StudentExamAttempt = StudentExamAttempt;
StudentExamAttempt.init({
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
    studentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff (student)',
    },
    attemptNumber: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    startTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    endTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    timeSpent: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Time in seconds',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('InProgress', 'Submitted', 'Graded', 'Abandoned'),
        defaultValue: 'InProgress',
    },
    isSubmitted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    submittedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    totalQuestions: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    questionsAnswered: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    questionsSkipped: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    marksObtained: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    totalMarks: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
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
    tableName: 'student_exam_attempt',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'examId'] },
        { fields: ['studentId'] },
        { fields: ['status'] },
        { fields: ['startTime'] },
        { fields: ['organizationId', 'studentId', 'examId'] },
    ],
});
exports.default = StudentExamAttempt;
//# sourceMappingURL=CBT-StudentExamAttempt.model.js.map