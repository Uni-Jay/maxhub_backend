"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetType = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class AssetType extends sequelize_1.Model {
    static initModel(sequelize) {
        AssetType.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            assetTypeCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Asset type code' },
            assetTypeName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Asset type name' },
            depreciation_method: { type: sequelize_1.DataTypes.ENUM('Straight', 'Accelerated', 'None'), defaultValue: 'Straight' },
            depreciation_years: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, comment: 'Depreciation years' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'asset_types', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['assetTypeCode'], name: 'idx_asset_types_assetTypeCode' },
                { fields: ['isActive'], name: 'idx_asset_types_isActive' },
                { fields: ['uuid'], name: 'idx_asset_types_uuid' },
            ],
            comment: 'Asset types'
        });
        return AssetType;
    }
}
exports.AssetType = AssetType;
//# sourceMappingURL=AssetType.model.js.map