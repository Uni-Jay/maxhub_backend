"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Certificate = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Certificate extends sequelize_1.Model {
}
exports.Certificate = Certificate;
Certificate.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    courseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Course',
    },
    studentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff (student)',
    },
    certificateNumber: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    issuanceDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    expiryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    certificateUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    certificateHash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        comment: 'SHA256 hash for verification',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Revoked', 'Expired'),
        defaultValue: 'Active',
    },
    issuerName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    issuerSignature: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    verificationUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff who issued',
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
    tableName: 'certificate',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'courseId'] },
        { fields: ['studentId'] },
        { fields: ['certificateNumber'] },
        { fields: ['status'] },
        { fields: ['issuanceDate'] },
    ],
});
exports.default = Certificate;
//# sourceMappingURL=LMS-Certificate.model.js.map