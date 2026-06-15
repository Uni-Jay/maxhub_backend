"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consultation = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Consultation extends sequelize_1.Model {
}
exports.Consultation = Consultation;
Consultation.init({
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
    consultationDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    consultantId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    consultationType: {
        type: sequelize_1.DataTypes.ENUM('Initial', 'Follow-up', 'Document Review', 'Interview Prep', 'Other'),
        allowNull: false,
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    topic: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    discussionPoints: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    recommendations: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    nextSteps: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled', 'Rescheduled'),
        defaultValue: 'Scheduled',
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
    tableName: 'consultation',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'visaApplicantId'] },
        { fields: ['consultationDate'] },
        { fields: ['consultantId'] },
    ],
});
exports.default = Consultation;
//# sourceMappingURL=Consultation.model.js.map