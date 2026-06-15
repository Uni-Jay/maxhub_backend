"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPermission = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class UserPermission extends sequelize_1.Model {
    static initModel(sequelize) {
        UserPermission.init({
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
            userId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to users table',
            },
            permissionId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to permissions table',
            },
            grantedAt: {
                type: sequelize_1.DataTypes.DATE,
                defaultValue: () => new Date(),
                allowNull: false,
                comment: 'When permission was granted to user',
            },
            expiresAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Optional permission expiry date for temporary access',
            },
            reason: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Reason for granting direct permission',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'user_permissions',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['userId'],
                    name: 'idx_user_permissions_userId',
                },
                {
                    fields: ['permissionId'],
                    name: 'idx_user_permissions_permissionId',
                },
                {
                    fields: ['userId', 'permissionId'],
                    unique: true,
                    name: 'idx_user_permissions_userId_permissionId_unique',
                },
                {
                    fields: ['expiresAt'],
                    name: 'idx_user_permissions_expiresAt',
                },
            ],
            comment: 'Direct permission assignment to users, bypassing roles (for temporary access)',
        });
        return UserPermission;
    }
    isExpired() {
        return this.expiresAt ? new Date() > this.expiresAt : false;
    }
}
exports.UserPermission = UserPermission;
//# sourceMappingURL=UserPermission.model.js.map