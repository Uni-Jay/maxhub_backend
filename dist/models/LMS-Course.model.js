"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Course extends sequelize_1.Model {
}
exports.Course = Course;
Course.init({
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
        allowNull: false,
        comment: 'NEW: FK to Department for RBAC filtering',
    },
    courseCode: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    courseName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    instructorId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
    },
    category: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    difficulty: {
        type: sequelize_1.DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
        defaultValue: 'Intermediate',
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Course duration in hours',
    },
    maxStudents: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    prerequisiteStatus: {
        type: sequelize_1.DataTypes.ENUM('None', 'Required', 'Recommended'),
        defaultValue: 'None',
        comment: 'NEW: Supports course prerequisites',
    },
    credits: {
        type: sequelize_1.DataTypes.DECIMAL(3, 1),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Draft', 'Active', 'Inactive', 'Archived'),
        defaultValue: 'Draft',
    },
    enrollmentStartDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    enrollmentEndDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    courseStartDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    courseEndDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    isPublic: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    thumbnailUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
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
    tableName: 'course',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'departmentId', 'status'] },
        { fields: ['courseCode'] },
        { fields: ['instructorId'] },
        { fields: ['category'] },
        { fields: ['status'] },
    ],
});
exports.default = Course;
//# sourceMappingURL=LMS-Course.model.js.map