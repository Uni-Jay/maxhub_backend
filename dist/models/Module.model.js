"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class AppModule extends sequelize_1.Model {
    static initModel(sequelize) {
        AppModule.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            name: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
            code: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            icon: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
            isDefault: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
            displayOrder: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0, allowNull: false },
        }, {
            sequelize,
            tableName: 'app_modules',
            timestamps: true,
            underscored: false,
            paranoid: false,
            indexes: [{ fields: ['code'], unique: true }],
        });
        return AppModule;
    }
}
exports.AppModule = AppModule;
//# sourceMappingURL=Module.model.js.map