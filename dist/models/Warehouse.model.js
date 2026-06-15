"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Warehouse = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Warehouse extends sequelize_1.Model {
    static initModel(sequelize) {
        Warehouse.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            warehouseCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Warehouse code' },
            warehouseName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Warehouse name' },
            locationId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Location ID' },
            address: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Address' },
            city: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'City' },
            state: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'State' },
            country: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Country' },
            managerUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Manager user ID' },
            capacity: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Warehouse capacity' },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'warehouses', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['warehouseCode'], name: 'idx_warehouses_warehouseCode' },
                { fields: ['locationId'], name: 'idx_warehouses_locationId' },
                { fields: ['managerUserId'], name: 'idx_warehouses_managerUserId' },
                { fields: ['isActive'], name: 'idx_warehouses_isActive' },
                { fields: ['uuid'], name: 'idx_warehouses_uuid' },
            ],
            comment: 'Warehouses'
        });
        return Warehouse;
    }
}
exports.Warehouse = Warehouse;
//# sourceMappingURL=Warehouse.model.js.map