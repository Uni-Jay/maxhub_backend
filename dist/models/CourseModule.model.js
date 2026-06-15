"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseModule = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class CourseModule extends sequelize_1.Model {
    static initModel(sequelize) {
        CourseModule.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            courseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course ID' },
            moduleCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, comment: 'Module code' },
            moduleName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Module name' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Module description' },
            sequence: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Display sequence' },
            duration: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Duration in hours' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Published', 'Archived'), defaultValue: 'Draft' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'course_modules', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['courseId'], name: 'idx_course_modules_courseId' },
                { fields: ['moduleCode'], name: 'idx_course_modules_moduleCode' },
                { fields: ['status'], name: 'idx_course_modules_status' },
                { fields: ['sequence'], name: 'idx_course_modules_sequence' },
                { fields: ['uuid'], name: 'idx_course_modules_uuid' },
            ],
            comment: 'Course modules'
        });
        return CourseModule;
    }
}
exports.CourseModule = CourseModule;
//# sourceMappingURL=CourseModule.model.js.map