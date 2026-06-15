"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exam = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Exam extends sequelize_1.Model {
}
exports.Exam = Exam;
Exam.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: FK to Department for RBAC enforcement',
    },
    examCode: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    examTitle: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    examType: {
        type: sequelize_1.DataTypes.ENUM('Quiz', 'Midterm', 'FinalExam', 'Assessment', 'PreTest', 'PostTest'),
        defaultValue: 'Quiz',
    },
    totalQuestions: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    totalPoints: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    passingScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Duration in minutes',
    },
    shuffleQuestions: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    shuffleQuestionsPerStudent: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'NEW: Each student gets randomized question order',
    },
    randomizeOptions: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    showCorrectAnswers: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    allowReview: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    maxAttempts: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    courseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Course',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Draft', 'Published', 'Active', 'Closed', 'Archived'),
        defaultValue: 'Draft',
    },
    startDateTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    endDateTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    examSecurityEnabled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'NEW: Enable tab switch detection, IP monitoring, etc.',
    },
    proctorRequired: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'NEW: Exam requires online proctor',
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
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
    tableName: 'exam',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'departmentId', 'status'] },
        { fields: ['examCode'] },
        { fields: ['courseId'] },
        { fields: ['startDateTime', 'endDateTime'] },
        { fields: ['organizationId', 'examType'] },
        { fields: ['departmentId', 'status', 'startDateTime'] },
    ],
});
exports.default = Exam;
//# sourceMappingURL=CBT-Exam-IMPROVED.model.js.map