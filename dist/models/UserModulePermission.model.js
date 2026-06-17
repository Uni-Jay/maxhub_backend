"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModulePermission = void 0;
const sequelize_1 = require("sequelize");
class UserModulePermission extends sequelize_1.Model {
    static initModel(sequelize) {
        UserModulePermission.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            userId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            moduleCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
            canView: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
            canCreate: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
            canEdit: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
            canDelete: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        }, {
            sequelize,
            tableName: 'user_module_permissions',
            timestamps: true,
            indexes: [{ fields: ['userId', 'moduleCode'], unique: true }],
        });
        return UserModulePermission;
    }
}
exports.UserModulePermission = UserModulePermission;
//# sourceMappingURL=UserModulePermission.model.js.map