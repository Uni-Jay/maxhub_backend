"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfile = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class StudentProfile extends sequelize_1.Model {
    static initModel(sequelize) {
        StudentProfile.init({
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
            },
            userId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
            companyId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            programId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            studentNumber: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
            gender: {
                type: sequelize_1.DataTypes.ENUM('Male', 'Female', 'Other'),
                allowNull: true,
            },
            dateOfBirth: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
            address: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            state: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            country: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, defaultValue: 'Nigeria' },
            profilePicture: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
            bio: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            guardianName: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            guardianPhone: { type: sequelize_1.DataTypes.STRING(30), allowNull: true },
            guardianEmail: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            guardianRelationship: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            emergencyContact: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            emergencyPhone: { type: sequelize_1.DataTypes.STRING(30), allowNull: true },
            enrollmentDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
            expectedGraduationDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
            graduationDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Graduated', 'Suspended', 'Withdrawn'),
                allowNull: false,
                defaultValue: 'Active',
            },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            registeredById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
        }, {
            sequelize,
            modelName: 'StudentProfile',
            tableName: 'student_profiles',
            timestamps: true,
            indexes: [
                { fields: ['userId'] },
                { fields: ['companyId'] },
                { fields: ['programId'] },
                { fields: ['status'] },
                { fields: ['studentNumber'], unique: true },
            ],
        });
        return StudentProfile;
    }
}
exports.StudentProfile = StudentProfile;
exports.default = StudentProfile;
//# sourceMappingURL=StudentProfile.model.js.map