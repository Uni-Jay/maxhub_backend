"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyReport = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class WeeklyReport extends sequelize_1.Model {
    static initModel(sequelize) {
        WeeklyReport.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            staffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Reference to staff table' },
            weekEnding: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, comment: 'Friday of the reporting week' },
            accomplishments: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            challenges: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            nextWeekPlans: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            hoursWorked: { type: sequelize_1.DataTypes.DECIMAL(5, 2), allowNull: true },
            hasBlocker: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            blockerNotes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            taskStatus: { type: sequelize_1.DataTypes.JSON, allowNull: true, comment: '{ assigned, inProgress, completed, delayed, blocked }' },
            attachments: { type: sequelize_1.DataTypes.JSON, allowNull: true, comment: 'Array of { url, publicId, name }' },
            approvalStatus: { type: sequelize_1.DataTypes.ENUM('Pending', 'Approved', 'Rejected'), allowNull: false, defaultValue: 'Pending' },
            approvedById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reference to users table' },
            approvedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            rejectionReason: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            comments: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Super Admin feedback, independent of approve/reject' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'weekly_reports', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['staffId', 'weekEnding'], unique: true, name: 'idx_weekly_reports_staff_week' },
                { fields: ['approvalStatus'], name: 'idx_weekly_reports_approvalStatus' },
            ],
            comment: 'Weekly status reports submitted by staff, reviewed by Super Admin',
        });
        return WeeklyReport;
    }
}
exports.WeeklyReport = WeeklyReport;
//# sourceMappingURL=WeeklyReport.model.js.map