"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationLog = void 0;
const sequelize_1 = require("sequelize");
class CommunicationLog extends sequelize_1.Model {
    static initModel(sequelize) {
        CommunicationLog.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, unique: true },
            type: {
                type: sequelize_1.DataTypes.ENUM('Weekly', 'Birthday', 'Manual', 'Scheduled'),
                allowNull: false,
            },
            channel: { type: sequelize_1.DataTypes.ENUM('Email', 'SMS', 'WhatsApp'), allowNull: false },
            recipientType: {
                type: sequelize_1.DataTypes.ENUM('All', 'Department', 'Selected', 'Country', 'Status'),
                defaultValue: 'All',
            },
            recipientFilter: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            subject: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
            message: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            totalRecipients: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
            successCount: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
            failureCount: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
            status: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'Sending', 'Completed', 'Failed', 'Partial'),
                defaultValue: 'Pending',
            },
            scheduledAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            sentAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            createdByUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            errorDetails: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        }, {
            sequelize,
            modelName: 'CommunicationLog',
            tableName: 'communication_logs',
            timestamps: true,
            underscored: false,
            freezeTableName: true,
        });
    }
}
exports.CommunicationLog = CommunicationLog;
exports.default = CommunicationLog;
//# sourceMappingURL=CommunicationLog.model.js.map