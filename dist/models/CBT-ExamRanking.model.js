"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamRanking = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ExamRanking extends sequelize_1.Model {
}
exports.ExamRanking = ExamRanking;
ExamRanking.init({
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
    studentName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Department',
    },
    rankPosition: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
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
    attemptDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    passStatus: {
        type: sequelize_1.DataTypes.ENUM('Pass', 'Fail'),
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'exam_ranking',
    timestamps: false,
    indexes: [
        { fields: ['organizationId', 'examId'] },
        { fields: ['rankPosition'] },
        { fields: ['percentage'] },
        { fields: ['departmentId'] },
    ],
});
exports.default = ExamRanking;
//# sourceMappingURL=CBT-ExamRanking.model.js.map