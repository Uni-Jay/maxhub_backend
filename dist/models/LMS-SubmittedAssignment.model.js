"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmittedAssignment = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class SubmittedAssignment extends sequelize_1.Model {
}
exports.SubmittedAssignment = SubmittedAssignment;
SubmittedAssignment.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    assignmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Assignment',
    },
    studentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff (student)',
    },
    submissionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    submissionUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    submissionText: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    attachmentUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Submitted', 'Graded', 'Returned', 'Late'),
        defaultValue: 'Submitted',
    },
    isLate: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    pointsEarned: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    feedback: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    gradedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff (instructor)',
    },
    gradedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    attempt: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
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
    tableName: 'submitted_assignment',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'assignmentId'] },
        { fields: ['studentId'] },
        { fields: ['status'] },
        { fields: ['gradedDate'] },
        { fields: ['organizationId', 'studentId', 'assignmentId'] },
    ],
});
exports.default = SubmittedAssignment;
//# sourceMappingURL=LMS-SubmittedAssignment.model.js.map