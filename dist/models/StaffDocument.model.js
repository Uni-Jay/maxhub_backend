"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffDocument = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class StaffDocument extends sequelize_1.Model {
    static initModel(sequelize) {
        StaffDocument.init({
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
            staffId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to staff table',
            },
            documentType: {
                type: sequelize_1.DataTypes.ENUM('Passport', 'NationalID', 'Visa', 'DrivingLicense', 'Insurance', 'HealthCertificate', 'Other'),
                allowNull: false,
                comment: 'Type of document',
            },
            documentName: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Display name for the document',
            },
            documentNumber: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Document reference number',
            },
            issueDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Date document was issued',
            },
            expiryDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Document expiry date',
            },
            issuedBy: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
                comment: 'Issuing authority',
            },
            documentUrl: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
                comment: 'URL to uploaded document file',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Expired', 'Archived'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Document status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'staff_documents',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['staffId'],
                    name: 'idx_staff_documents_staffId',
                },
                {
                    fields: ['documentType'],
                    name: 'idx_staff_documents_documentType',
                },
                {
                    fields: ['status'],
                    name: 'idx_staff_documents_status',
                },
                {
                    fields: ['expiryDate'],
                    name: 'idx_staff_documents_expiryDate',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_staff_documents_uuid',
                },
            ],
            comment: 'Employee documents (passport, visa, licenses, etc.)',
        });
        return StaffDocument;
    }
    isExpired() {
        if (!this.expiryDate)
            return false;
        return new Date() > this.expiryDate;
    }
    daysUntilExpiry() {
        if (!this.expiryDate)
            return null;
        const now = new Date();
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        return Math.ceil((this.expiryDate.getTime() - now.getTime()) / millisecondsPerDay);
    }
}
exports.StaffDocument = StaffDocument;
//# sourceMappingURL=StaffDocument.model.js.map