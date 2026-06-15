"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supplier = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Supplier extends sequelize_1.Model {
    static initModel(sequelize) {
        Supplier.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            supplierCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Supplier code' },
            supplierName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Supplier name' },
            contactPerson: { type: sequelize_1.DataTypes.STRING(150), allowNull: true, comment: 'Contact person' },
            phone: { type: sequelize_1.DataTypes.STRING(20), allowNull: true, comment: 'Phone' },
            email: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Email' },
            address: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Address' },
            city: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'City' },
            state: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'State' },
            country: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Country' },
            taxId: { type: sequelize_1.DataTypes.STRING(50), allowNull: true, comment: 'Tax ID' },
            paymentTerms: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Payment terms' },
            status: { type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Blocked'), defaultValue: 'Active' },
            rating: { type: sequelize_1.DataTypes.DECIMAL(3, 2), allowNull: true, comment: 'Rating 1-5' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Notes' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'suppliers', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['supplierCode'], name: 'idx_suppliers_supplierCode' },
                { fields: ['status'], name: 'idx_suppliers_status' },
                { fields: ['city'], name: 'idx_suppliers_city' },
                { fields: ['country'], name: 'idx_suppliers_country' },
                { fields: ['uuid'], name: 'idx_suppliers_uuid' },
            ],
            comment: 'Suppliers'
        });
        return Supplier;
    }
}
exports.Supplier = Supplier;
//# sourceMappingURL=Supplier.model.js.map