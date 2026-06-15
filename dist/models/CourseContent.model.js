"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseContent = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class CourseContent extends sequelize_1.Model {
    static initModel(sequelize) {
        CourseContent.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            moduleId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course module ID' },
            contentType: { type: sequelize_1.DataTypes.ENUM('Video', 'Document', 'Quiz', 'Assignment', 'Resource', 'Interactive'), allowNull: false },
            contentTitle: { type: sequelize_1.DataTypes.STRING(300), allowNull: false, comment: 'Content title' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            contentUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'URL to content' },
            sequence: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Display sequence' },
            duration: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Duration in minutes' },
            isRequired: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is required for completion' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Published', 'Archived'), defaultValue: 'Draft' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'course_contents', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['moduleId'], name: 'idx_course_contents_moduleId' },
                { fields: ['contentType'], name: 'idx_course_contents_contentType' },
                { fields: ['status'], name: 'idx_course_contents_status' },
                { fields: ['sequence'], name: 'idx_course_contents_sequence' },
                { fields: ['uuid'], name: 'idx_course_contents_uuid' },
            ],
            comment: 'Course content items'
        });
        return CourseContent;
    }
}
exports.CourseContent = CourseContent;
//# sourceMappingURL=CourseContent.model.js.map