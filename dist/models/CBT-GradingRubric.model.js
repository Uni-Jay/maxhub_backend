"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradingRubric = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class GradingRubric extends sequelize_1.Model {
}
exports.GradingRubric = GradingRubric;
GradingRubric.init({
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
        comment: 'FK to Question (Essay/ShortAnswer only)',
    },
    rubricName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    totalPoints: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Archived'),
        defaultValue: 'Active',
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
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
    tableName: 'grading_rubric',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'questionId'] },
        { fields: ['status'] },
    ],
});
exports.default = GradingRubric;
//# sourceMappingURL=CBT-GradingRubric.model.js.map