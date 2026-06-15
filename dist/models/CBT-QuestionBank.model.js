"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionBank = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class QuestionBank extends sequelize_1.Model {
}
exports.QuestionBank = QuestionBank;
QuestionBank.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'NEW: FK to Department for RBAC filtering',
    },
    bankCode: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    bankName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    category: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    totalQuestions: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Denormalized count, updated via trigger',
    },
    difficulty: {
        type: sequelize_1.DataTypes.ENUM('Mixed', 'Easy', 'Intermediate', 'Advanced'),
        defaultValue: 'Mixed',
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    isPublic: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Archived'),
        defaultValue: 'Active',
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
    tableName: 'question_bank',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'departmentId', 'status'] },
        { fields: ['bankCode'] },
        { fields: ['category'] },
        { fields: ['difficulty'] },
    ],
});
exports.default = QuestionBank;
//# sourceMappingURL=CBT-QuestionBank.model.js.map