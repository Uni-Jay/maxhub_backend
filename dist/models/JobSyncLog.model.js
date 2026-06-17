"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSyncLog = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class JobSyncLog extends sequelize_1.Model {
    static initModel(sequelize) {
        JobSyncLog.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            jobPostingId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Reference to job_postings table' },
            businessUnit: { type: sequelize_1.DataTypes.STRING(10), allowNull: false, comment: 'Snapshot of the business unit at sync time (KS/VM/BM)' },
            action: { type: sequelize_1.DataTypes.ENUM('Create', 'Update', 'Delete'), allowNull: false },
            status: { type: sequelize_1.DataTypes.ENUM('Success', 'Failed'), allowNull: false },
            httpStatusCode: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            errorMessage: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            attemptNumber: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        }, {
            sequelize, tableName: 'job_sync_logs', timestamps: true, paranoid: false, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['jobPostingId'], name: 'idx_job_sync_logs_jobPostingId' },
                { fields: ['status'], name: 'idx_job_sync_logs_status' },
            ],
            comment: 'Audit trail of job posting sync attempts to external business unit portals',
        });
        return JobSyncLog;
    }
}
exports.JobSyncLog = JobSyncLog;
//# sourceMappingURL=JobSyncLog.model.js.map