"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Session extends sequelize_1.Model {
    static initModel(sequelize) {
        Session.init({
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
            refreshToken: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
                comment: 'JWT refresh token (hashed)',
            },
            accessTokenHash: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
                comment: 'SHA256 hash of access token for reference',
            },
            ipAddress: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: true,
                comment: 'Client IP address (IPv4 or IPv6)',
            },
            userAgent: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Client user agent string',
            },
            expiresAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                comment: 'Session expiry time',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp (logout)',
            },
        }, {
            sequelize,
            tableName: 'sessions',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['userId'],
                    name: 'idx_sessions_userId',
                },
                {
                    fields: ['expiresAt'],
                    name: 'idx_sessions_expiresAt',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_sessions_uuid',
                },
            ],
            comment: 'User session tokens for authentication',
        });
        return Session;
    }
    isValid() {
        return !this.deletedAt && new Date() < this.expiresAt;
    }
}
exports.Session = Session;
//# sourceMappingURL=Session.model.js.map