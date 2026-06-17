"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Staff = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Staff extends sequelize_1.Model {
    static initModel(sequelize) {
        Staff.init({
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
                unique: true,
                comment: 'Reference to users table',
            },
            employeeId: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: true,
                comment: 'Auto-generated employee ID e.g. VM001',
            },
            firstName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
            },
            lastName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
            },
            email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                validate: { isEmail: true },
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false,
            },
            alternatePhone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
            },
            whatsappNumber: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
            },
            socialMediaHandle: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            dateOfBirth: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            gender: {
                type: sequelize_1.DataTypes.ENUM('Male', 'Female', 'Other'),
                allowNull: true,
            },
            homeAddress: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            utilityBillDocument: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
                comment: 'File URL for utility bill document',
            },
            validIdType: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'e.g. NIN, Passport, Drivers License, Voters Card',
            },
            validIdNumber: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            idDocument: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
                comment: 'File URL for ID card document',
            },
            emergencyContactName: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            emergencyContactPhone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
            },
            emergencyRelationship: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            emergencyHomeAddress: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            emergencyOfficeAddress: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            educationLevel: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'e.g. OND, HND, BSc, MSc, PhD',
            },
            degree: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            institution: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            major: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            graduationYear: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            nyscCompleted: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            certificateDocument: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
                comment: 'File URL for NYSC/degree certificate',
            },
            hasCertification: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            certifications: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: 'Array of professional certifications',
            },
            previousWorkHistory: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: 'Array of previous employers and roles',
            },
            skills: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: 'Array of skills',
            },
            guarantor1Name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            guarantor1Relationship: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            guarantor1Phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
            },
            guarantor1Address: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            guarantor1Email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
            },
            guarantor1Occupation: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            guarantor1DurationKnown: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'How long the guarantor has known the staff member',
            },
            guarantor2Name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            guarantor2Relationship: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            guarantor2Phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
            },
            guarantor2Address: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            guarantor2Email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
            },
            guarantor2Occupation: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            guarantor2DurationKnown: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            jobTitle: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            hireDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            employmentStatus: {
                type: sequelize_1.DataTypes.ENUM('Full-Time', 'Part-Time', 'Contract', 'Intern', 'Probation'),
                allowNull: true,
            },
            bankName: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            accountType: {
                type: sequelize_1.DataTypes.ENUM('Savings', 'Current'),
                allowNull: true,
            },
            accountName: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            accountNumber: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true,
            },
            hasMedicalCondition: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            medicalConditions: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
            },
            medications: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
            },
            readJobDescription: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            acceptedCompanyPolicy: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            receivedCompanyAssets: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            assignedAssets: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: 'List of company assets assigned to staff',
            },
            signatureImage: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
                comment: 'File URL for staff signature image',
            },
            signedDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            departmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Primary department (legacy FK)',
            },
            designationId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            locationId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            reportingManagerId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            branchId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to branches table',
            },
            unitId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to units table — primary core unit',
            },
            joiningDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            permanentDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            bloodGroup: {
                type: sequelize_1.DataTypes.STRING(5),
                allowNull: true,
            },
            maritalStatus: {
                type: sequelize_1.DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
                allowNull: true,
            },
            nationality: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'OnLeave', 'Suspended', 'Resigned', 'Retired'),
                defaultValue: 'Active',
                allowNull: false,
            },
            position: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
            },
            businessUnit: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            businessUnits: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize,
            tableName: 'staff',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            hooks: {
                beforeCreate: async (staff) => {
                    if (!staff.employeeId) {
                        const bu = (staff.businessUnit || staff.businessUnits?.[0] || '').toLowerCase();
                        let prefix = 'VM';
                        if (bu.includes('beadmax') || bu.includes('bead'))
                            prefix = 'BM';
                        else if (bu.includes('kurios'))
                            prefix = 'KS';
                        const count = await Staff.count({
                            where: { employeeId: { [require('sequelize').Op.iLike]: `${prefix}%` } },
                            paranoid: false,
                        });
                        staff.employeeId = `${prefix}${String(count + 1).padStart(3, '0')}`;
                    }
                },
            },
            indexes: [
                { fields: ['employeeId'], name: 'idx_staff_employeeId' },
                { fields: ['userId'], name: 'idx_staff_userId' },
                { fields: ['departmentId'], name: 'idx_staff_departmentId' },
                { fields: ['designationId'], name: 'idx_staff_designationId' },
                { fields: ['locationId'], name: 'idx_staff_locationId' },
                { fields: ['reportingManagerId'], name: 'idx_staff_reportingManagerId' },
                { fields: ['branchId'], name: 'idx_staff_branchId' },
                { fields: ['unitId'], name: 'idx_staff_unitId' },
                { fields: ['status'], name: 'idx_staff_status' },
                { fields: ['email'], name: 'idx_staff_email' },
                { fields: ['joiningDate'], name: 'idx_staff_joiningDate' },
                { fields: ['uuid'], name: 'idx_staff_uuid' },
            ],
            comment: 'Employee staff records with full onboarding profile',
        });
        return Staff;
    }
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    getExperienceYears() {
        const now = new Date();
        return Math.floor((now.getTime() - this.joiningDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }
}
exports.Staff = Staff;
//# sourceMappingURL=Staff.model.js.map