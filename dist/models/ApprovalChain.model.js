"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalChain = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ApprovalChain extends sequelize_1.Model {
}
exports.ApprovalChain = ApprovalChain;
ApprovalChain.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    workflowName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    entityType: {
        type: sequelize_1.DataTypes.ENUM('Payroll', 'Expense', 'PurchaseOrder', 'Invoice', 'Leave', 'Other'),
        allowNull: false,
    },
    approvalLevel: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: '1=first approver, 2=second, etc',
    },
    approverRoleId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to role table: which role can approve',
    },
    minAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Minimum amount requiring this approval level',
    },
    maxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Maximum amount this approval level can handle',
    },
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'Null = applies to all departments',
    },
    requiresAll: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'true = all approvers required, false = any one',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'approval_chain',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'entityType'] },
        { fields: ['approvalLevel'] },
        { fields: ['approverRoleId'] },
        {
            fields: ['organizationId', 'entityType', 'approvalLevel'],
            name: 'idx_approval_chain_lookup',
        },
    ],
});
exports.default = ApprovalChain;
//# sourceMappingURL=ApprovalChain.model.js.map