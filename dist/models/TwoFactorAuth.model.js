"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorAuth = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class TwoFactorAuth extends sequelize_1.Model {
    static initModel(sequelize) {
        TwoFactorAuth.init({
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
            method: {
                type: sequelize_1.DataTypes.ENUM('TOTP', 'SMS', 'EMAIL', 'BACKUP_CODES'),
                allowNull: false,
                comment: '2FA method (TOTP=authenticator app, SMS, EMAIL, BACKUP_CODES)',
            },
            secret: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Encrypted TOTP secret key',
            },
            qrCode: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'QR code image data for TOTP setup',
            },
            phoneNumber: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
                comment: 'Phone number for SMS 2FA',
            },
            isEnabled: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                index: true,
            },
            isVerified: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether 2FA setup has been verified',
            },
            verifiedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When 2FA was first verified',
            },
            backupCodes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'JSON array of encrypted backup codes for recovery',
            },
            backupCodesUsed: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'JSON array of used backup code IDs',
            },
            lastUsedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Last time 2FA was verified successfully',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'two_factor_auths',
            timestamps: true,
            paranoid: true,
            indexes: [
                { fields: ['userId', 'isEnabled'] },
                { fields: ['userId', 'method'] },
            ],
            comment: 'Two-factor authentication settings per user',
        });
        return TwoFactorAuth;
    }
}
exports.TwoFactorAuth = TwoFactorAuth;
//# sourceMappingURL=TwoFactorAuth.model.js.map