"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoftwareClient = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class SoftwareClient extends sequelize_1.Model {
}
exports.SoftwareClient = SoftwareClient;
SoftwareClient.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    clientName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    contactPerson: {
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
    company: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    industryType: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    softwareProjects: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    currentProjectCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    totalProjectValue: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    contractStartDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    contractEndDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Suspended', 'Terminated'),
        defaultValue: 'Active',
    },
    assignedAccount: {
        type: sequelize_1.DataTypes.BIGINT,
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
    tableName: 'software_client',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['email'] },
        { fields: ['assignedAccount'] },
    ],
});
exports.default = SoftwareClient;
//# sourceMappingURL=SoftwareClient.model.js.map