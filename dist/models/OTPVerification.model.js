"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPVerification = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class OTPVerification extends sequelize_1.Model {
    static initModel(sequelize) {
        OTPVerification.init({
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
            email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                comment: 'Email address for OTP delivery',
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
                comment: 'Phone number for SMS OTP',
            },
            otpCode: {
                type: sequelize_1.DataTypes.STRING(10),
                allowNull: false,
                comment: 'Plain text OTP (only in memory during generation)',
            },
            otpHash: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                comment: 'Bcrypt hashed OTP for storage',
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('2FA', 'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION'),
                allowNull: false,
                comment: 'Type of OTP verification',
            },
            isUsed: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether OTP has been used',
            },
            usedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When OTP was verified',
            },
            expiresAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                comment: 'OTP expiration time (typically 15 minutes)',
            },
            attempts: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                allowNull: false,
                comment: 'Failed verification attempts',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'otp_verifications',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['userId'],
                    name: 'idx_otp_verifications_userId',
                },
                {
                    fields: ['email'],
                    name: 'idx_otp_verifications_email',
                },
                {
                    fields: ['type'],
                    name: 'idx_otp_verifications_type',
                },
                {
                    fields: ['expiresAt'],
                    name: 'idx_otp_verifications_expiresAt',
                },
                {
                    fields: ['isUsed'],
                    name: 'idx_otp_verifications_isUsed',
                },
            ],
            comment: 'OTP verification for 2FA, email verification, and password reset',
        });
        return OTPVerification;
    }
    isExpired() {
        return new Date() > this.expiresAt;
    }
    canVerify() {
        return !this.isUsed && !this.isExpired() && this.attempts < 5;
    }
}
exports.OTPVerification = OTPVerification;
//# sourceMappingURL=OTPVerification.model.js.map