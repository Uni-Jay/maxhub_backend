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
                allowNull: false,
                comment: 'Unique employee identifier',
            },
            firstName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Employee first name',
            },
            lastName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Employee last name',
            },
            email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                validate: { isEmail: true },
                comment: 'Work email address',
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false,
                comment: 'Work phone number',
            },
            alternatePhone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
                comment: 'Alternate contact number',
            },
            dateOfBirth: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                comment: 'Employee date of birth',
            },
            gender: {
                type: sequelize_1.DataTypes.ENUM('Male', 'Female', 'Other'),
                allowNull: true,
                comment: 'Employee gender',
            },
            departmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to departments table',
            },
            designationId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to designations table',
            },
            locationId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to locations table',
            },
            reportingManagerId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to staff table for manager hierarchy',
            },
            joiningDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                comment: 'Employee joining date',
            },
            permanentDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Date employee became permanent',
            },
            bloodGroup: {
                type: sequelize_1.DataTypes.STRING(5),
                allowNull: true,
                comment: 'Blood group (A+, B-, etc.)',
            },
            maritalStatus: {
                type: sequelize_1.DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
                allowNull: true,
                comment: 'Marital status',
            },
            nationality: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Nationality/country',
            },
            emergencyContactName: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
                comment: 'Emergency contact name',
            },
            emergencyContactPhone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
                comment: 'Emergency contact phone',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'OnLeave', 'Suspended', 'Resigned', 'Retired'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Employee status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'staff',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['employeeId'],
                    name: 'idx_staff_employeeId',
                },
                {
                    fields: ['userId'],
                    name: 'idx_staff_userId',
                },
                {
                    fields: ['departmentId'],
                    name: 'idx_staff_departmentId',
                },
                {
                    fields: ['designationId'],
                    name: 'idx_staff_designationId',
                },
                {
                    fields: ['locationId'],
                    name: 'idx_staff_locationId',
                },
                {
                    fields: ['reportingManagerId'],
                    name: 'idx_staff_reportingManagerId',
                },
                {
                    fields: ['status'],
                    name: 'idx_staff_status',
                },
                {
                    fields: ['email'],
                    name: 'idx_staff_email',
                },
                {
                    fields: ['joiningDate'],
                    name: 'idx_staff_joiningDate',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_staff_uuid',
                },
            ],
            comment: 'Employee staff records with organizational hierarchy',
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