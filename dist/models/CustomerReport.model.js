"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerReport = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class CustomerReport extends sequelize_1.Model {
    static initModel(sequelize) {
        CustomerReport.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            clientName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            clientPhone: { type: sequelize_1.DataTypes.STRING(30), allowNull: true },
            clientEmail: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            assignedStaff: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            servicePurchased: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            department: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            businessUnit: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
            currentStatus: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            pendingActions: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            completedActions: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            totalAmount: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
            amountPaid: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
            outstandingBalance: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
            notes: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [] },
            payments: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [] },
            attachments: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [] },
            approvalStatus: {
                type: sequelize_1.DataTypes.ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Revision Requested', 'Archived'),
                allowNull: false,
                defaultValue: 'Draft',
            },
            submittedBy: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            submittedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            approvedBy: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            approvedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            rejectionReason: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            revisionNote: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            tableName: 'customer_reports',
            paranoid: true,
            timestamps: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                { fields: ['businessUnit'] },
                { fields: ['approvalStatus'] },
                { fields: ['createdById'] },
            ],
        });
        return CustomerReport;
    }
}
exports.CustomerReport = CustomerReport;
exports.default = CustomerReport;
//# sourceMappingURL=CustomerReport.model.js.map