"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamResult = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ExamResult extends sequelize_1.Model {
}
exports.ExamResult = ExamResult;
ExamResult.init({
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
    totalMarks: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    obtainedMarks: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    percentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    grade: {
        type: sequelize_1.DataTypes.ENUM('A+', 'A', 'B+', 'B', 'C', 'D', 'F'),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Pass', 'Fail'),
        allowNull: false,
    },
    resultDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    viewedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    certificateEligible: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    resultDetails: {
        type: sequelize_1.DataTypes.TEXT,
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
    tableName: 'exam_result',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'examId'] },
        { fields: ['studentId'] },
        { fields: ['status'] },
        { fields: ['grade'] },
        { fields: ['resultDate'] },
        { fields: ['organizationId', 'studentId', 'examId'] },
    ],
});
exports.default = ExamResult;
//# sourceMappingURL=CBT-ExamResult.model.js.map