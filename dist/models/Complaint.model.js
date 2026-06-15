"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Complaint = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Complaint extends sequelize_1.Model {
    static initModel(sequelize) {
        Complaint.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            complaintCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Complaint code' },
            complaintType: { type: sequelize_1.DataTypes.ENUM('Internal', 'External', 'Harassment', 'Discrimination', 'Safety', 'Quality', 'Other'), allowNull: false },
            raisedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Raised by user ID' },
            againstPerson: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Against user/staff ID' },
            againstDepartment: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Against department ID' },
            subject: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Subject' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Complaint description' },
            priority: { type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
            status: { type: sequelize_1.DataTypes.ENUM('Open', 'UnderInvestigation', 'Resolved', 'Closed', 'Escalated'), defaultValue: 'Open' },
            raiseDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Raise date' },
            resolutionDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Resolution date' },
            resolutionNotes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Resolution notes' },
            assignedTo: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Assigned to user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'complaints', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['complaintCode'], name: 'idx_complaints_complaintCode' },
                { fields: ['complaintType'], name: 'idx_complaints_complaintType' },
                { fields: ['priority'], name: 'idx_complaints_priority' },
                { fields: ['status'], name: 'idx_complaints_status' },
                { fields: ['raisedBy'], name: 'idx_complaints_raisedBy' },
                { fields: ['assignedTo'], name: 'idx_complaints_assignedTo' },
                { fields: ['uuid'], name: 'idx_complaints_uuid' },
            ],
            comment: 'Employee complaints and grievances'
        });
        return Complaint;
    }
}
exports.Complaint = Complaint;
//# sourceMappingURL=Complaint.model.js.map