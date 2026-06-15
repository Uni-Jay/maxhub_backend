"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentEnrollment = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class StudentEnrollment extends sequelize_1.Model {
}
exports.StudentEnrollment = StudentEnrollment;
StudentEnrollment.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    courseId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Course',
    },
    studentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff (student)',
    },
    enrollmentDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    completionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Completed', 'Dropped', 'Suspended'),
        defaultValue: 'Active',
    },
    progress: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Progress percentage 0-100',
    },
    totalScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    certificateId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Certificate',
    },
    certificateEarned: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    certificateDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'student_enrollment',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'courseId'] },
        { fields: ['studentId'] },
        { fields: ['status'] },
        { fields: ['certificateEarned'] },
        { fields: ['organizationId', 'studentId', 'status'] },
        {
            fields: ['organizationId', 'courseId', 'status'],
            unique: true,
            where: { deletedAt: null },
            name: 'uq_enrollment_active',
        },
    ],
});
exports.default = StudentEnrollment;
//# sourceMappingURL=LMS-StudentEnrollment.model.js.map