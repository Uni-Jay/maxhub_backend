"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSetting = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class SystemSetting extends sequelize_1.Model {
    static initModel(sequelize) {
        SystemSetting.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            settingKey: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, unique: true, comment: 'Setting key' },
            settingValue: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Setting value' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            category: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, comment: 'Category' },
            dataType: { type: sequelize_1.DataTypes.ENUM('String', 'Number', 'Boolean', 'JSON'), defaultValue: 'String' },
            isEditable: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is editable' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'system_settings', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['settingKey'], name: 'idx_system_settings_settingKey' },
                { fields: ['category'], name: 'idx_system_settings_category' },
                { fields: ['uuid'], name: 'idx_system_settings_uuid' },
            ],
            comment: 'System configuration settings'
        });
        return SystemSetting;
    }
}
exports.SystemSetting = SystemSetting;
//# sourceMappingURL=SystemSetting.model.js.map