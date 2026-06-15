"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingStudent = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class TrainingStudent extends sequelize_1.Model {
}
exports.TrainingStudent = TrainingStudent;
TrainingStudent.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
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
    trainingProgram: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    enrollmentDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    completionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    courseLevel: {
        type: sequelize_1.DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
        defaultValue: 'Beginner',
    },
    trainingMode: {
        type: sequelize_1.DataTypes.ENUM('Online', 'Offline', 'Hybrid'),
        defaultValue: 'Online',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Enrolled', 'In Progress', 'Completed', 'Dropped', 'Suspended'),
        defaultValue: 'Enrolled',
    },
    assignedInstructor: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    certificationStatus: {
        type: sequelize_1.DataTypes.ENUM('Not Eligible', 'Eligible', 'Certified'),
        defaultValue: 'Not Eligible',
    },
    performanceScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
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
    tableName: 'training_student',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['email'] },
        { fields: ['enrollmentDate'] },
    ],
});
exports.default = TrainingStudent;
//# sourceMappingURL=TrainingStudent.model.js.map