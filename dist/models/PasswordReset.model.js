"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordReset = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class PasswordReset extends sequelize_1.Model {
    static initModel(sequelize) {
        PasswordReset.init({
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
                index: true,
            },
            userId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                index: true,
            },
            email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                comment: 'Email address for password reset verification',
            },
            token: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
                comment: 'Plain reset token (only in memory during generation)',
            },
            tokenHash: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                comment: 'SHA256 hashed token for storage',
                unique: true,
                index: true,
            },
            ipAddress: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: true,
                comment: 'IP address that requested the reset',
            },
            userAgent: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'User agent of the reset request',
            },
            isUsed: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                index: true,
                comment: 'Whether reset token has been used',
            },
            usedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When reset token was used',
            },
            expiresAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                index: true,
                comment: 'Token expiration timestamp',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'password_resets',
            timestamps: true,
            paranoid: true,
            indexes: [
                { fields: ['userId', 'isUsed'] },
                { fields: ['email', 'expiresAt'] },
                { fields: ['tokenHash'] },
            ],
            comment: 'Password reset token management',
        });
        return PasswordReset;
    }
}
exports.PasswordReset = PasswordReset;
//# sourceMappingURL=PasswordReset.model.js.map