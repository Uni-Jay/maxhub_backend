"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionOption = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class QuestionOption extends sequelize_1.Model {
}
exports.QuestionOption = QuestionOption;
QuestionOption.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    questionId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Question',
    },
    optionLetter: {
        type: sequelize_1.DataTypes.CHAR(1),
        allowNull: false,
    },
    optionText: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: false,
    },
    isCorrect: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    order: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
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
    tableName: 'question_option',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'questionId'] },
        { fields: ['isCorrect'] },
    ],
});
exports.default = QuestionOption;
//# sourceMappingURL=CBT-QuestionOption.model.js.map