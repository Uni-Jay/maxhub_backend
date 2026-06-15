"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplication = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class JobApplication extends sequelize_1.Model {
    static initModel(sequelize) {
        JobApplication.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            jobPostingId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job posting ID' },
            contactId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Contact/applicant ID' },
            applicantName: { type: sequelize_1.DataTypes.STRING(150), allowNull: false, comment: 'Full name' },
            applicantEmail: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, comment: 'Email address' },
            applicantPhone: { type: sequelize_1.DataTypes.STRING(20), allowNull: false, comment: 'Phone number' },
            resumeUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Resume URL' },
            coverLetterUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Cover letter URL' },
            applicationDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Application date' },
            status: { type: sequelize_1.DataTypes.ENUM('Applied', 'Shortlisted', 'Rejected', 'Interviewed', 'Offered', 'Withdrawn'), defaultValue: 'Applied' },
            source: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Source (LinkedIn, etc)' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Recruiter notes' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'job_applications', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['jobPostingId'], name: 'idx_job_applications_jobPostingId' },
                { fields: ['contactId'], name: 'idx_job_applications_contactId' },
                { fields: ['status'], name: 'idx_job_applications_status' },
                { fields: ['applicantEmail'], name: 'idx_job_applications_applicantEmail' },
                { fields: ['uuid'], name: 'idx_job_applications_uuid' },
            ],
            comment: 'Job applications'
        });
        return JobApplication;
    }
}
exports.JobApplication = JobApplication;
//# sourceMappingURL=JobApplication.model.js.map