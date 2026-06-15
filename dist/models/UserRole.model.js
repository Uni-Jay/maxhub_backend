"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class UserRole extends sequelize_1.Model {
    static initModel(sequelize) {
        UserRole.init({
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
            roleId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to roles table',
            },
            assignedAt: {
                type: sequelize_1.DataTypes.DATE,
                defaultValue: () => new Date(),
                allowNull: false,
                comment: 'When role was assigned to user',
            },
            expiresAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Optional role expiry date for temporary assignments',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'user_roles',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['userId'],
                    name: 'idx_user_roles_userId',
                },
                {
                    fields: ['roleId'],
                    name: 'idx_user_roles_roleId',
                },
                {
                    fields: ['userId', 'roleId'],
                    unique: true,
                    name: 'idx_user_roles_userId_roleId_unique',
                },
                {
                    fields: ['expiresAt'],
                    name: 'idx_user_roles_expiresAt',
                },
            ],
            comment: 'Junction table for many-to-many user-role relationships',
        });
        return UserRole;
    }
    isExpired() {
        return this.expiresAt ? new Date() > this.expiresAt : false;
    }
}
exports.UserRole = UserRole;
//# sourceMappingURL=UserRole.model.js.map