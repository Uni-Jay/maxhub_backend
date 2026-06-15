"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSecurityLog = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ExamSecurityLog extends sequelize_1.Model {
}
exports.ExamSecurityLog = ExamSecurityLog;
ExamSecurityLog.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    examAttemptId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to StudentExamAttempt',
    },
    eventType: {
        type: sequelize_1.DataTypes.ENUM('TabSwitch', 'IPChange', 'CopyPaste', 'ScreenShare', 'DevTools', 'Refresh'),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    flaggedAs: {
        type: sequelize_1.DataTypes.ENUM('Normal', 'Suspicious', 'Flagged'),
        defaultValue: 'Normal',
    },
    detectedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    detectedBy: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        comment: 'System or proctorId',
    },
    severity: {
        type: sequelize_1.DataTypes.ENUM('Info', 'Warning', 'Critical'),
        defaultValue: 'Info',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'exam_security_log',
    timestamps: true,
    paranoid: false,
    indexes: [
        { fields: ['organizationId', 'examAttemptId'] },
        { fields: ['eventType'] },
        { fields: ['flaggedAs'] },
        { fields: ['severity'] },
        { fields: ['detectedAt'] },
    ],
});
exports.default = ExamSecurityLog;
//# sourceMappingURL=CBT-ExamSecurityLog.model.js.map