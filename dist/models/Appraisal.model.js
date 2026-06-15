"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appraisal = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Appraisal extends sequelize_1.Model {
    static initModel(sequelize) {
        Appraisal.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            appraisalCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Appraisal code' },
            staffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
            appraisalPeriod: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, comment: 'Period' },
            appraisalDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Appraisal date' },
            reviewerUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Reviewer user ID' },
            overallRating: { type: sequelize_1.DataTypes.DECIMAL(3, 2), allowNull: false, comment: 'Overall rating 1-5' },
            performanceNotes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Performance notes' },
            strengths: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Strengths' },
            improvements: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Improvements' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'InProgress', 'Completed', 'Approved', 'Rejected'), defaultValue: 'Draft' },
            completedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Completion date' },
            approvedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Approved by user ID' },
            approvedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Approval date' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'appraisals', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['appraisalCode'], name: 'idx_appraisals_appraisalCode' },
                { fields: ['staffId'], name: 'idx_appraisals_staffId' },
                { fields: ['appraisalPeriod'], name: 'idx_appraisals_appraisalPeriod' },
                { fields: ['status'], name: 'idx_appraisals_status' },
                { fields: ['reviewerUserId'], name: 'idx_appraisals_reviewerUserId' },
                { fields: ['uuid'], name: 'idx_appraisals_uuid' },
            ],
            comment: 'Performance appraisals'
        });
        return Appraisal;
    }
}
exports.Appraisal = Appraisal;
//# sourceMappingURL=Appraisal.model.js.map