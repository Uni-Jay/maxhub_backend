"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Permission extends sequelize_1.Model {
    static initModel(sequelize) {
        Permission.init({
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
                type: sequelize_1.DataTypes.STRING(150),
                unique: true,
                allowNull: false,
                comment: 'Unique permission code (e.g., auth.login, staff.create.all)',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Human-readable permission name',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Detailed permission description',
            },
            module: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Permission module (auth, user, staff, project, etc.)',
            },
            resource: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Resource being acted upon (user, staff, task, etc.)',
            },
            action: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Action type (create, read, update, delete, approve, etc.)',
            },
            scope: {
                type: sequelize_1.DataTypes.ENUM('all', 'own', 'own_department'),
                defaultValue: 'all',
                allowNull: false,
                comment: 'Permission scope: all records, own records, or own department only',
            },
            isActive: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
                comment: 'Permission active status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'permissions',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['code'],
                    name: 'idx_permissions_code',
                },
                {
                    fields: ['module'],
                    name: 'idx_permissions_module',
                },
                {
                    fields: ['action'],
                    name: 'idx_permissions_action',
                },
                {
                    fields: ['isActive'],
                    name: 'idx_permissions_isActive',
                },
                {
                    fields: ['module', 'resource', 'action'],
                    name: 'idx_permissions_module_resource_action',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_permissions_uuid',
                },
            ],
            comment: 'Permission codes for fine-grained RBAC',
        });
        return Permission;
    }
}
exports.Permission = Permission;
//# sourceMappingURL=Permission.model.js.map