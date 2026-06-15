"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class User extends sequelize_1.Model {
    static initModel(sequelize) {
        User.init({
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
            firstName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'User first name',
            },
            lastName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'User last name',
            },
            email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                validate: { isEmail: true },
                comment: 'Unique email address',
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
                comment: 'Contact phone number',
            },
            avatar: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Profile image URL/path',
            },
            passwordHash: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                comment: 'Bcrypt hashed password',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'User account status',
            },
            emailVerified: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Email verification status',
            },
            emailVerifiedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Email verification timestamp',
            },
            lastLoginAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Last login timestamp',
            },
            loginAttempts: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                allowNull: false,
                comment: 'Failed login attempt counter',
            },
            lockedUntil: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Account lockout expiry time',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'users',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['email'],
                    name: 'idx_users_email',
                },
                {
                    fields: ['status'],
                    name: 'idx_users_status',
                },
                {
                    fields: ['createdAt'],
                    name: 'idx_users_createdAt',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_users_uuid',
                },
            ],
            comment: 'System users table with authentication',
        });
        return User;
    }
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    isLocked() {
        return this.lockedUntil ? new Date() < this.lockedUntil : false;
    }
}
exports.User = User;
//# sourceMappingURL=User.model.js.map