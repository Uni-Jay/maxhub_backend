"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSLog = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class SMSLog extends sequelize_1.Model {
}
exports.SMSLog = SMSLog;
SMSLog.init({
    id: { type: sequelize_1.DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: sequelize_1.DataTypes.BIGINT, allowNull: false },
    notificationId: { type: sequelize_1.DataTypes.BIGINT, allowNull: false },
    recipientPhone: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
    messageText: { type: sequelize_1.DataTypes.STRING(1000), allowNull: false, comment: 'SMS message content' },
    deliveryStatus: { type: sequelize_1.DataTypes.ENUM('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED'), defaultValue: 'QUEUED' },
    sentAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    deliveredAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    failureReason: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    providerReference: { type: sequelize_1.DataTypes.STRING(255), allowNull: true, comment: 'Twilio/AWS SNS reference ID' },
    retryCount: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    lastRetryAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    createdAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    updatedAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: Database_1.default,
    tableName: 'sms_logs',
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'deliveryStatus'] },
        { fields: ['notificationId'] },
        { fields: ['recipientPhone', 'createdAt'] },
    ],
});
exports.default = SMSLog;
//# sourceMappingURL=SMSLog.model.js.map