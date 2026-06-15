"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostingClient = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class HostingClient extends sequelize_1.Model {
}
exports.HostingClient = HostingClient;
HostingClient.init({
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
    websiteDomain: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    hostingType: {
        type: sequelize_1.DataTypes.ENUM('Shared', 'VPS', 'Dedicated', 'Cloud', 'Other'),
        defaultValue: 'Shared',
    },
    serverLocation: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    monthlyBillingAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    billingCycle: {
        type: sequelize_1.DataTypes.ENUM('Monthly', 'Quarterly', 'Annually'),
        defaultValue: 'Monthly',
    },
    renewalDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Suspended', 'Expired'),
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
    tableName: 'hosting_client',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['email'] },
        { fields: ['renewalDate'] },
        { fields: ['assignedAccount'] },
    ],
});
exports.default = HostingClient;
//# sourceMappingURL=HostingClient.model.js.map