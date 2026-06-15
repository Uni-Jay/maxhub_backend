"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assignment = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Assignment extends sequelize_1.Model {
    static initModel(sequelize) {
        Assignment.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            courseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course ID' },
            assignmentCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Assignment code' },
            assignmentName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Assignment name' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            points: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Total points' },
            dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Due date' },
            allowLateSubmission: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Allow late submission' },
            latePenaltyPercentage: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Late penalty %' },
            submissionType: { type: sequelize_1.DataTypes.ENUM('File', 'Text', 'Link', 'Quiz'), allowNull: false },
            maxFileSize: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Max file size in MB' },
            allowedFileTypes: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Allowed file types' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Published', 'Closed', 'Archived'), defaultValue: 'Draft' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'assignments', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['courseId'], name: 'idx_assignments_courseId' },
                { fields: ['assignmentCode'], name: 'idx_assignments_assignmentCode' },
                { fields: ['dueDate'], name: 'idx_assignments_dueDate' },
                { fields: ['status'], name: 'idx_assignments_status' },
                { fields: ['createdById'], name: 'idx_assignments_createdById' },
                { fields: ['uuid'], name: 'idx_assignments_uuid' },
            ],
            comment: 'Course assignments'
        });
        return Assignment;
    }
}
exports.Assignment = Assignment;
//# sourceMappingURL=Assignment.model.js.map