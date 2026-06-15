"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Role extends sequelize_1.Model {
    static initModel(sequelize) {
        Role.init({
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
                comment: 'External API reference UUID',
            },
            code: {
                type: sequelize_1.DataTypes.STRING(100),
                unique: true,
                allowNull: false,
                comment: 'Unique role identifier (e.g., SUPER_ADMIN)',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(150),
                allowNull: false,
                comment: 'Role display name',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Role purpose and responsibilities',
            },
            isSystemRole: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether role is built-in system role',
            },
            isActive: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
                comment: 'Role active status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'roles',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['code'],
                    name: 'idx_roles_code',
                },
                {
                    fields: ['isActive'],
                    name: 'idx_roles_isActive',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_roles_uuid',
                },
            ],
            comment: 'System roles for RBAC',
        });
        return Role;
    }
}
exports.Role = Role;
//# sourceMappingURL=Role.model.js.map