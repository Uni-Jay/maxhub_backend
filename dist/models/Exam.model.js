"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exam = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Exam extends sequelize_1.Model {
    static initModel(sequelize) {
        Exam.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            courseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course ID' },
            examCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Exam code' },
            examName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Exam name' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Exam description' },
            totalQuestions: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Total questions' },
            passingScore: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Passing score %' },
            duration: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Duration in minutes' },
            attempts: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1, comment: 'Max attempts' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Published', 'Archived', 'Disabled'), defaultValue: 'Draft' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'exams', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['courseId'], name: 'idx_exams_courseId' },
                { fields: ['examCode'], name: 'idx_exams_examCode' },
                { fields: ['status'], name: 'idx_exams_status' },
                { fields: ['createdById'], name: 'idx_exams_createdById' },
                { fields: ['uuid'], name: 'idx_exams_uuid' },
            ],
            comment: 'Exams/assessments'
        });
        return Exam;
    }
}
exports.Exam = Exam;
//# sourceMappingURL=Exam.model.js.map