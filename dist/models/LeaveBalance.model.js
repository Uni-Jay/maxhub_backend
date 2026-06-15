"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveBalance = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class LeaveBalance extends sequelize_1.Model {
    static initModel(sequelize) {
        LeaveBalance.init({
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
            year: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                comment: 'Leave year',
            },
            totalDays: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false,
                comment: 'Total leave days allocated',
            },
            usedDays: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                defaultValue: 0,
                allowNull: false,
                comment: 'Days already used',
            },
            pendingDays: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                defaultValue: 0,
                allowNull: false,
                comment: 'Days in pending approval',
            },
            balanceDays: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false,
                comment: 'Available days (totalDays - usedDays - pendingDays)',
            },
            carryForwardDays: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: true,
                comment: 'Carryover from previous year',
            },
            lastUpdated: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                comment: 'Last balance update timestamp',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'leave_balances',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['staffId'],
                    name: 'idx_leave_balances_staffId',
                },
                {
                    fields: ['leaveTypeId'],
                    name: 'idx_leave_balances_leaveTypeId',
                },
                {
                    fields: ['year'],
                    name: 'idx_leave_balances_year',
                },
                {
                    fields: ['staffId', 'leaveTypeId', 'year'],
                    unique: true,
                    name: 'idx_leave_balances_staffId_leaveTypeId_year_unique',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_leave_balances_uuid',
                },
            ],
            comment: 'Employee leave balance tracking',
        });
        return LeaveBalance;
    }
    getAvailableBalance() {
        return Number(this.balanceDays);
    }
    updateBalance(approvedDays, pendingDays = 0) {
        this.usedDays = Number(this.usedDays) + approvedDays;
        this.pendingDays = Number(this.pendingDays) + pendingDays;
        this.balanceDays = Number(this.totalDays) - Number(this.usedDays) - Number(this.pendingDays);
        this.lastUpdated = new Date();
    }
}
exports.LeaveBalance = LeaveBalance;
//# sourceMappingURL=LeaveBalance.model.js.map