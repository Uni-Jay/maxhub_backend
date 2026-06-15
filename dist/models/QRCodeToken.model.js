"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeToken = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class QRCodeToken extends sequelize_1.Model {
    static initModel(sequelize) {
        QRCodeToken.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                unique: true,
                defaultValue: uuid_1.v4,
            },
            organizationId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
            },
            tokenHash: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            nonce: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Used', 'Expired', 'Revoked'),
                allowNull: false,
                defaultValue: 'Active',
            },
            generatedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            generatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            expiresAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            usedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            usedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            usedAtLatitude: {
                type: sequelize_1.DataTypes.DECIMAL(10, 8),
                allowNull: true,
            },
            usedAtLongitude: {
                type: sequelize_1.DataTypes.DECIMAL(11, 8),
                allowNull: true,
            },
            geohashAtGeneration: {
                type: sequelize_1.DataTypes.STRING(10),
                allowNull: true,
            },
            geohashAtUsage: {
                type: sequelize_1.DataTypes.STRING(10),
                allowNull: true,
            },
            geohashValid: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            usageCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        }, {
            sequelize,
            modelName: 'qr_code_token',
            tableName: 'qr_code_token',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['organizationId', 'status', 'expiresAt'],
                },
                {
                    fields: ['nonce'],
                    unique: true,
                },
                {
                    fields: ['usedBy', 'usedAt'],
                },
            ],
        });
        return QRCodeToken;
    }
}
exports.QRCodeToken = QRCodeToken;
//# sourceMappingURL=QRCodeToken.model.js.map