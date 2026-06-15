"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursePrerequisite = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class CoursePrerequisite extends sequelize_1.Model {
}
exports.CoursePrerequisite = CoursePrerequisite;
CoursePrerequisite.init({
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
    prerequisiteCourseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Course (prerequisite)',
    },
    isRequired: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'course_prerequisite',
    timestamps: true,
    paranoid: false,
    indexes: [
        { fields: ['organizationId', 'courseId'] },
        { fields: ['prerequisiteCourseId'] },
        {
            fields: ['courseId', 'prerequisiteCourseId'],
            unique: true,
            name: 'uq_prerequisite_pair',
        },
    ],
});
exports.default = CoursePrerequisite;
//# sourceMappingURL=LMS-CoursePrerequisite.model.js.map