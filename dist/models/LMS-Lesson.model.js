"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lesson = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Lesson extends sequelize_1.Model {
}
exports.Lesson = Lesson;
Lesson.init({
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
    courseModuleId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to CourseModule for organization',
    },
    lessonTitle: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    lessonNumber: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    content: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    sequence: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Draft', 'Published', 'Archived'),
        defaultValue: 'Draft',
    },
    isPreview: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
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
    tableName: 'lesson',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'courseId'] },
        { fields: ['courseModuleId'] },
        { fields: ['sequence'] },
        { fields: ['organizationId', 'courseId', 'status'] },
    ],
});
exports.default = Lesson;
//# sourceMappingURL=LMS-Lesson.model.js.map