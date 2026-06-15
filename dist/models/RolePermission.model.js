"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermission = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class RolePermission extends sequelize_1.Model {
    static initModel(sequelize) {
        RolePermission.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                unique: true,
                allowNull: false,
            },
            roleId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to roles table',
            },
            permissionId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to permissions table',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'role_permissions',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['roleId'],
                    name: 'idx_role_permissions_roleId',
                },
                {
                    fields: ['permissionId'],
                    name: 'idx_role_permissions_permissionId',
                },
                {
                    fields: ['roleId', 'permissionId'],
                    unique: true,
                    name: 'idx_role_permissions_roleId_permissionId_unique',
                },
            ],
            comment: 'Junction table for many-to-many role-permission relationships',
        });
        return RolePermission;
    }
}
exports.RolePermission = RolePermission;
//# sourceMappingURL=RolePermission.model.js.map