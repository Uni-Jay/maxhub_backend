"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequest = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class LeaveRequest extends sequelize_1.Model {
    static initModel(sequelize) {
        LeaveRequest.init({
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
            leaveTypeId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to leave_types table',
            },
            startDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Leave start date',
            },
            endDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Leave end date',
            },
            numberofDays: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false,
                comment: 'Number of days requested',
            },
            reason: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
                comment: 'Reason for leave request',
            },
            documentUrl: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'URL to supporting document (medical cert, etc.)',
            },
            approverUserId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Manager/approver user ID',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'Withdrawn'),
                defaultValue: 'Pending',
                allowNull: false,
                comment: 'Leave request status',
            },
            approvalComments: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Approver comments',
            },
            approvalDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When approval/rejection was made',
            },
            cancelledBy: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'User who cancelled the leave',
            },
            cancellationReason: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Reason for cancellation',
            },
            cancellationDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When leave was cancelled',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'leave_requests',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['staffId'],
                    name: 'idx_leave_requests_staffId',
                },
                {
                    fields: ['leaveTypeId'],
                    name: 'idx_leave_requests_leaveTypeId',
                },
                {
                    fields: ['status'],
                    name: 'idx_leave_requests_status',
                },
                {
                    fields: ['approverUserId'],
                    name: 'idx_leave_requests_approverUserId',
                },
                {
                    fields: ['startDate', 'endDate'],
                    name: 'idx_leave_requests_startDate_endDate',
                },
                {
                    fields: ['createdAt'],
                    name: 'idx_leave_requests_createdAt',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_leave_requests_uuid',
                },
            ],
            comment: 'Leave requests from employees',
        });
        return LeaveRequest;
    }
    canBeCancelled() {
        return this.status === 'Pending' || this.status === 'Approved';
    }
    canBeWithdrawn() {
        return this.status === 'Pending';
    }
    calculateDays() {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }
    isInPast() {
        return new Date(this.endDate) < new Date();
    }
}
exports.LeaveRequest = LeaveRequest;
//# sourceMappingURL=LeaveRequest.model.js.map