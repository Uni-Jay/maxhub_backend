"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisaApplicant = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class VisaApplicant extends sequelize_1.Model {
}
exports.VisaApplicant = VisaApplicant;
VisaApplicant.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    passportNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    visaType: {
        type: sequelize_1.DataTypes.ENUM('Tourist', 'Business', 'Student', 'Work', 'Residence'),
        allowNull: false,
    },
    destinationCountry: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    applicationDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('New', 'In Progress', 'Document Review', 'Interview', 'Approved', 'Rejected', 'Cancelled'),
        defaultValue: 'New',
    },
    assignedTo: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    priorityLevel: {
        type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
        defaultValue: 'Medium',
    },
    documentStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Submitted', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
    },
    interviewScheduled: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    expectedDecisionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    rejectionReason: {
        type: sequelize_1.DataTypes.TEXT,
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
    tableName: 'visa_applicant',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['passportNumber'] },
        { fields: ['email'] },
        { fields: ['assignedTo'] },
        { fields: ['applicationDate'] },
    ],
});
exports.default = VisaApplicant;
//# sourceMappingURL=VisaApplicant.model.js.map