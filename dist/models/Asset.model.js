"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Asset = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Asset extends sequelize_1.Model {
    static initModel(sequelize) {
        Asset.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            assetCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Asset code' },
            assetTypeId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Asset type ID' },
            assetName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Asset name' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            serialNumber: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, unique: true, comment: 'Serial number' },
            purchaseDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Purchase date' },
            purchasePrice: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Purchase price' },
            currentValue: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Current value' },
            locationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Location ID' },
            assignedTo: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Assigned to user ID' },
            status: { type: sequelize_1.DataTypes.ENUM('New', 'InUse', 'Maintenance', 'Retired', 'Scrapped'), defaultValue: 'New' },
            warrantExpiryDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Warranty expiry date' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Notes' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'assets', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['assetCode'], name: 'idx_assets_assetCode' },
                { fields: ['assetTypeId'], name: 'idx_assets_assetTypeId' },
                { fields: ['serialNumber'], name: 'idx_assets_serialNumber' },
                { fields: ['status'], name: 'idx_assets_status' },
                { fields: ['assignedTo'], name: 'idx_assets_assignedTo' },
                { fields: ['uuid'], name: 'idx_assets_uuid' },
            ],
            comment: 'Fixed assets'
        });
        return Asset;
    }
}
exports.Asset = Asset;
//# sourceMappingURL=Asset.model.js.map