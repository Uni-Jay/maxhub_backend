"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOffer = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class JobOffer extends sequelize_1.Model {
    static initModel(sequelize) {
        JobOffer.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            jobApplicationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job application ID' },
            offerDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Offer date' },
            expectedJoiningDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Expected joining date' },
            offeredSalary: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Annual salary offered' },
            currency: { type: sequelize_1.DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
            offerDocument: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Offer letter URL' },
            status: { type: sequelize_1.DataTypes.ENUM('Pending', 'Accepted', 'Rejected', 'Withdrawn', 'Expired'), defaultValue: 'Pending' },
            acceptedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'When accepted' },
            rejectedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'When rejected' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Internal notes' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'job_offers', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['jobApplicationId'], name: 'idx_job_offers_jobApplicationId' },
                { fields: ['status'], name: 'idx_job_offers_status' },
                { fields: ['createdById'], name: 'idx_job_offers_createdById' },
                { fields: ['expectedJoiningDate'], name: 'idx_job_offers_expectedJoiningDate' },
                { fields: ['uuid'], name: 'idx_job_offers_uuid' },
            ],
            comment: 'Job offers'
        });
        return JobOffer;
    }
}
exports.JobOffer = JobOffer;
//# sourceMappingURL=JobOffer.model.js.map