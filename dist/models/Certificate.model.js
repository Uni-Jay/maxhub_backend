"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Certificate = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Certificate extends sequelize_1.Model {
    static initModel(sequelize) {
        Certificate.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            enrollmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Enrollment ID' },
            certificateCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Certificate code' },
            certificateName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Certificate name' },
            issuedDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Issue date' },
            expiryDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Expiry date (if applicable)' },
            certificateUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Certificate URL' },
            verificationCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Verification code' },
            status: { type: sequelize_1.DataTypes.ENUM('Issued', 'Revoked', 'Expired'), defaultValue: 'Issued' },
            revokedReason: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Reason if revoked' },
            revokedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'When revoked' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'certificates', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['enrollmentId'], name: 'idx_certificates_enrollmentId' },
                { fields: ['certificateCode'], name: 'idx_certificates_certificateCode' },
                { fields: ['verificationCode'], name: 'idx_certificates_verificationCode' },
                { fields: ['status'], name: 'idx_certificates_status' },
                { fields: ['issuedDate'], name: 'idx_certificates_issuedDate' },
                { fields: ['uuid'], name: 'idx_certificates_uuid' },
            ],
            comment: 'Training certificates'
        });
        return Certificate;
    }
}
exports.Certificate = Certificate;
//# sourceMappingURL=Certificate.model.js.map