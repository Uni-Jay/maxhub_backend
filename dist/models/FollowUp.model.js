"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUp = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class FollowUp extends sequelize_1.Model {
}
exports.FollowUp = FollowUp;
FollowUp.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    visaApplicantId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    followUpDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    followUpType: {
        type: sequelize_1.DataTypes.ENUM('Status Check', 'Document Request', 'Payment Reminder', 'Interview Prep', 'Consultation', 'Other'),
        allowNull: false,
    },
    followUpBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
        defaultValue: 'Medium',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Completed', 'Cancelled'),
        defaultValue: 'Pending',
    },
    completedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    outcome: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    nextFollowUpDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
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
    tableName: 'follow_up',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'visaApplicantId'] },
        { fields: ['followUpDate'] },
        { fields: ['status'] },
    ],
});
exports.default = FollowUp;
//# sourceMappingURL=FollowUp.model.js.map