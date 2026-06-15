"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Account extends sequelize_1.Model {
    static initModel(sequelize) {
        Account.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            accountCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Account code' },
            accountName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Account name' },
            accountType: { type: sequelize_1.DataTypes.ENUM('Business', 'Individual', 'Government', 'NGO', 'Other'), allowNull: false },
            industry: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Industry' },
            website: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Website URL' },
            phone: { type: sequelize_1.DataTypes.STRING(20), allowNull: true, comment: 'Phone' },
            email: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Email' },
            address: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Address' },
            city: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'City' },
            state: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'State' },
            country: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Country' },
            postalCode: { type: sequelize_1.DataTypes.STRING(20), allowNull: true, comment: 'Postal code' },
            ownerUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Account owner user ID' },
            status: { type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Prospect', 'Paused'), defaultValue: 'Active' },
            annualRevenue: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: true, comment: 'Annual revenue' },
            numberOfEmployees: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Number of employees' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'accounts', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['accountCode'], name: 'idx_accounts_accountCode' },
                { fields: ['accountType'], name: 'idx_accounts_accountType' },
                { fields: ['ownerUserId'], name: 'idx_accounts_ownerUserId' },
                { fields: ['status'], name: 'idx_accounts_status' },
                { fields: ['city'], name: 'idx_accounts_city' },
                { fields: ['country'], name: 'idx_accounts_country' },
                { fields: ['uuid'], name: 'idx_accounts_uuid' },
            ],
            comment: 'CRM Accounts'
        });
        return Account;
    }
}
exports.Account = Account;
//# sourceMappingURL=Account.model.js.map