"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffQualification = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class StaffQualification extends sequelize_1.Model {
    static initModel(sequelize) {
        StaffQualification.init({
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
            qualificationType: {
                type: sequelize_1.DataTypes.ENUM('Degree', 'Diploma', 'Certificate', 'License', 'Certification'),
                allowNull: false,
                comment: 'Type of qualification',
            },
            qualification: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Qualification name (MBA, B.Tech, etc.)',
            },
            institution: {
                type: sequelize_1.DataTypes.STRING(300),
                allowNull: false,
                comment: 'Institution/university name',
            },
            fieldOfStudy: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
                comment: 'Major/field of study',
            },
            completionDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                comment: 'Qualification completion date',
            },
            expiryDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Expiry date for certifications/licenses',
            },
            documentUrl: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'URL to uploaded certificate/document',
            },
            verificationStatus: {
                type: sequelize_1.DataTypes.ENUM('Pending', 'Verified', 'Rejected'),
                defaultValue: 'Pending',
                allowNull: false,
                comment: 'HR verification status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'staff_qualifications',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['staffId'],
                    name: 'idx_staff_qualifications_staffId',
                },
                {
                    fields: ['qualificationType'],
                    name: 'idx_staff_qualifications_qualificationType',
                },
                {
                    fields: ['verificationStatus'],
                    name: 'idx_staff_qualifications_verificationStatus',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_staff_qualifications_uuid',
                },
            ],
            comment: 'Employee educational qualifications and certifications',
        });
        return StaffQualification;
    }
    isValid() {
        if (!this.expiryDate)
            return true;
        return new Date() < this.expiryDate;
    }
}
exports.StaffQualification = StaffQualification;
//# sourceMappingURL=StaffQualification.model.js.map