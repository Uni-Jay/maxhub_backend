"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailLog = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class EmailLog extends sequelize_1.Model {
}
exports.EmailLog = EmailLog;
EmailLog.init({
    id: { type: sequelize_1.DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: sequelize_1.DataTypes.BIGINT, allowNull: false },
    notificationId: { type: sequelize_1.DataTypes.BIGINT, allowNull: false },
    recipientEmail: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    subject: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    bodyHtml: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    deliveryStatus: { type: sequelize_1.DataTypes.ENUM('QUEUED', 'SENDING', 'SENT', 'BOUNCED', 'FAILED'), defaultValue: 'QUEUED' },
    sentAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    deliveredAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    bouncedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    failureReason: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    providerReference: { type: sequelize_1.DataTypes.STRING(255), allowNull: true, comment: 'SES/SendGrid reference ID' },
    retryCount: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    lastRetryAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    createdAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    updatedAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: Database_1.default,
    tableName: 'email_logs',
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'deliveryStatus'] },
        { fields: ['notificationId'] },
        { fields: ['recipientEmail', 'createdAt'] },
    ],
});
exports.default = EmailLog;
//# sourceMappingURL=EmailLog.model.js.map