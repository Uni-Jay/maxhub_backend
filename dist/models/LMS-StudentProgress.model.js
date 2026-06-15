"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProgress = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class StudentProgress extends sequelize_1.Model {
}
exports.StudentProgress = StudentProgress;
StudentProgress.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    studentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff (student)',
    },
    courseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Course',
    },
    lessonId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Lesson',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Skipped'),
        defaultValue: 'Not Started',
    },
    startedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    timeSpent: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Time in seconds',
    },
    videoProgress: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Video completion percentage',
    },
    viewed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    notes: {
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
    tableName: 'student_progress',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'studentId', 'courseId'] },
        { fields: ['lessonId'] },
        { fields: ['status'] },
        {
            fields: ['studentId', 'lessonId'],
            unique: true,
            where: { deletedAt: null },
            name: 'uq_student_lesson_progress',
        },
    ],
});
exports.default = StudentProgress;
//# sourceMappingURL=LMS-StudentProgress.model.js.map