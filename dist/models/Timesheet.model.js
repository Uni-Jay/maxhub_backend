"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timesheet = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Timesheet extends sequelize_1.Model {
    static initModel(sequelize) {
        Timesheet.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                unique: true,
                allowNull: false,
            },
            staffId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to staff table',
            },
            projectId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to projects table',
            },
            taskId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to tasks table',
            },
            timesheetDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Date for which timesheet entry is created',
            },
            hoursWorked: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false,
                validate: {
                    min: 0,
                    max: 24,
                },
                comment: 'Number of hours worked',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
                comment: 'Work description/activities',
            },
            category: {
                type: sequelize_1.DataTypes.ENUM('Development', 'Testing', 'Design', 'Management', 'Support', 'Other'),
                defaultValue: 'Development',
                allowNull: false,
                comment: 'Work category',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
                defaultValue: 'Draft',
                allowNull: false,
                comment: 'Timesheet status',
            },
            submittedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When timesheet was submitted',
            },
            approvedBy: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Manager who approved the timesheet',
            },
            approvalStatus: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
                defaultValue: 'Pending',
                allowNull: false,
                comment: 'Manager approval status',
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Approval remarks',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'timesheets',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['staffId'],
                    name: 'idx_timesheets_staffId',
                },
                {
                    fields: ['projectId'],
                    name: 'idx_timesheets_projectId',
                },
                {
                    fields: ['taskId'],
                    name: 'idx_timesheets_taskId',
                },
                {
                    fields: ['timesheetDate'],
                    name: 'idx_timesheets_timesheetDate',
                },
                {
                    fields: ['status'],
                    name: 'idx_timesheets_status',
                },
                {
                    fields: ['approvalStatus'],
                    name: 'idx_timesheets_approvalStatus',
                },
                {
                    fields: ['staffId', 'timesheetDate'],
                    name: 'idx_timesheets_staffId_timesheetDate',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_timesheets_uuid',
                },
            ],
            comment: 'Employee timesheets for project tracking',
        });
        return Timesheet;
    }
}
exports.Timesheet = Timesheet;
//# sourceMappingURL=Timesheet.model.js.map