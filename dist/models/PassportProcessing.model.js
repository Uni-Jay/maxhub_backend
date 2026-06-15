"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportProcessing = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PassportProcessing extends sequelize_1.Model {
}
exports.PassportProcessing = PassportProcessing;
PassportProcessing.init({
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
    passportNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    passportExpiryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    applicationDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    processingStage: {
        type: sequelize_1.DataTypes.ENUM('Submitted', 'Under Review', 'Approved', 'Ready for Pickup', 'Collected', 'Rejected'),
        defaultValue: 'Submitted',
    },
    processingFee: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    feePaid: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    feePaymentDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    estimatedCompletionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    actualCompletionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    pickupLocation: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Completed', 'Delayed', 'On Hold', 'Cancelled'),
        defaultValue: 'Active',
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
    tableName: 'passport_processing',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'visaApplicantId'] },
        { fields: ['passportNumber'] },
        { fields: ['processingStage'] },
        { fields: ['status'] },
    ],
});
exports.default = PassportProcessing;
//# sourceMappingURL=PassportProcessing.model.js.map