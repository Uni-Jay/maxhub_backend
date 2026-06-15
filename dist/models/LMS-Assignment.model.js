"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assignment = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Assignment extends sequelize_1.Model {
}
exports.Assignment = Assignment;
Assignment.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    courseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Course',
    },
    lessonId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Lesson',
    },
    assignmentTitle: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    instructions: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    totalPoints: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    passingPoints: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    assignmentType: {
        type: sequelize_1.DataTypes.ENUM('Quiz', 'Exercise', 'Project', 'Discussion', 'Submission'),
        defaultValue: 'Exercise',
    },
    allowLateSubmission: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    latePenalty: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Penalty percentage for late submission',
    },
    maxAttempts: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    attachmentUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Draft', 'Active', 'Closed', 'Archived'),
        defaultValue: 'Draft',
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
    tableName: 'assignment',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'courseId'] },
        { fields: ['lessonId'] },
        { fields: ['dueDate'] },
        { fields: ['status'] },
        { fields: ['organizationId', 'status', 'dueDate'] },
    ],
});
exports.default = Assignment;
//# sourceMappingURL=LMS-Assignment.model.js.map