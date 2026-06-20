"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Company = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Company extends sequelize_1.Model {
    static initModel(sequelize) {
        Company.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                allowNull: false,
                unique: true,
            },
            name: { type: sequelize_1.DataTypes.STRING(150), allowNull: false },
            code: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                unique: true,
            },
            type: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
            },
            logo: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
            address: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            city: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            country: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            phone: { type: sequelize_1.DataTypes.STRING(30), allowNull: true },
            email: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            website: { type: sequelize_1.DataTypes.STRING(300), allowNull: true },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
                allowNull: false,
                defaultValue: 'Active',
            },
            settings: { type: sequelize_1.DataTypes.JSON, allowNull: true },
        }, {
            sequelize,
            modelName: 'Company',
            tableName: 'companies',
            timestamps: true,
            underscored: false,
            paranoid: false,
        });
        return Company;
    }
}
exports.Company = Company;
exports.default = Company;
//# sourceMappingURL=Company.model.js.map