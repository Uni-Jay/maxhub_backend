"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Submission = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Submission extends sequelize_1.Model {
    static initModel(sequelize) {
        Submission.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            assignmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Assignment ID' },
            enrollmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Enrollment ID' },
            submissionText: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Text submission' },
            submissionUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'URL submission' },
            submissionFile: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'File URL' },
            submittedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Submission date' },
            isLate: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is late submission' },
            scoredPoints: { type: sequelize_1.DataTypes.DECIMAL(5, 2), allowNull: true, comment: 'Points scored' },
            feedback: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Feedback from reviewer' },
            reviewedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reviewed by user ID' },
            reviewedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Review date' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Submitted', 'Reviewed', 'Returned', 'Late'), defaultValue: 'Draft' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'submissions', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['assignmentId'], name: 'idx_submissions_assignmentId' },
                { fields: ['enrollmentId'], name: 'idx_submissions_enrollmentId' },
                { fields: ['status'], name: 'idx_submissions_status' },
                { fields: ['submittedAt'], name: 'idx_submissions_submittedAt' },
                { fields: ['assignmentId', 'enrollmentId'], name: 'idx_submissions_assignment_enrollment' },
                { fields: ['uuid'], name: 'idx_submissions_uuid' },
            ],
            comment: 'Assignment submissions'
        });
        return Submission;
    }
}
exports.Submission = Submission;
//# sourceMappingURL=Submission.model.js.map