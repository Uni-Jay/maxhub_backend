"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobPosting = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class JobPosting extends sequelize_1.Model {
    static initModel(sequelize) {
        JobPosting.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            jobCode: { type: sequelize_1.DataTypes.STRING(50), unique: true, allowNull: false, comment: 'Job posting code' },
            title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Job title' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Job description' },
            departmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Hiring department' },
            designationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job designation' },
            noOfPositions: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Number of positions' },
            jobType: { type: sequelize_1.DataTypes.ENUM('Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'), allowNull: false },
            salaryMin: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: true, comment: 'Minimum salary' },
            salaryMax: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: true, comment: 'Maximum salary' },
            currency: { type: sequelize_1.DataTypes.STRING(3), defaultValue: 'USD', allowNull: true },
            location: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Job location' },
            requiredExperience: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Required experience' },
            qualifications: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Required qualifications' },
            skills: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Required skills' },
            benefits: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Job benefits' },
            postedDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'When job was posted' },
            closingDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Application closing date' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Open', 'Closed', 'OnHold', 'Filled'), defaultValue: 'Draft' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'job_postings', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['jobCode'], name: 'idx_job_postings_jobCode' },
                { fields: ['status'], name: 'idx_job_postings_status' },
                { fields: ['departmentId'], name: 'idx_job_postings_departmentId' },
                { fields: ['closingDate'], name: 'idx_job_postings_closingDate' },
                { fields: ['uuid'], name: 'idx_job_postings_uuid' },
            ],
            comment: 'Job postings'
        });
        return JobPosting;
    }
    isActive() {
        return this.status === 'Open' && new Date() <= this.closingDate;
    }
    isClosed() {
        return new Date() > this.closingDate || this.status === 'Closed' || this.status === 'Filled';
    }
}
exports.JobPosting = JobPosting;
//# sourceMappingURL=JobPosting.model.js.map