"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartOfAccounts = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class ChartOfAccounts extends sequelize_1.Model {
    static initModel(sequelize) {
        ChartOfAccounts.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            accountCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Account code' },
            accountName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Account name' },
            accountType: { type: sequelize_1.DataTypes.ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'CostOfGoodsSold'), allowNull: false },
            subType: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Sub-type' },
            parentAccountId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Parent account ID' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'chart_of_accounts', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['accountCode'], name: 'idx_chart_of_accounts_accountCode' },
                { fields: ['accountType'], name: 'idx_chart_of_accounts_accountType' },
                { fields: ['parentAccountId'], name: 'idx_chart_of_accounts_parentAccountId' },
                { fields: ['isActive'], name: 'idx_chart_of_accounts_isActive' },
                { fields: ['uuid'], name: 'idx_chart_of_accounts_uuid' },
            ],
            comment: 'Chart of accounts for accounting'
        });
        return ChartOfAccounts;
    }
}
exports.ChartOfAccounts = ChartOfAccounts;
//# sourceMappingURL=ChartOfAccounts.model.js.map