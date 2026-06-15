"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Question extends sequelize_1.Model {
}
exports.Question = Question;
Question.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    questionBankId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to QuestionBank',
    },
    questionText: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: false,
    },
    questionType: {
        type: sequelize_1.DataTypes.ENUM('MultipleChoice', 'TrueFalse', 'ShortAnswer', 'Essay', 'Matching'),
        allowNull: false,
    },
    difficulty: {
        type: sequelize_1.DataTypes.ENUM('Easy', 'Medium', 'Hard'),
        defaultValue: 'Medium',
    },
    category: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    points: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    correctAnswer: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    explanation: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    timeLimit: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Time in seconds for this question',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Draft', 'Active', 'Inactive', 'Archived'),
        defaultValue: 'Draft',
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
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
    tableName: 'question',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['questionBankId'] },
        { fields: ['category'] },
        { fields: ['difficulty'] },
        { fields: ['questionType'] },
    ],
});
exports.default = Question;
//# sourceMappingURL=CBT-Question.model.js.map