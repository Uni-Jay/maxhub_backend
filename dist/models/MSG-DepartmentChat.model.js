"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentChat = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class DepartmentChat extends sequelize_1.Model {
}
exports.DepartmentChat = DepartmentChat;
DepartmentChat.init({
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
        allowNull: false,
        comment: 'FK to Department',
    },
    chatName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    chatImageUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
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
    tableName: 'department_chat',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'departmentId'] },
        { fields: ['isActive'] },
        {
            fields: ['organizationId', 'departmentId'],
            unique: true,
            where: { deletedAt: null },
            name: 'uq_org_dept_chat',
        },
    ],
});
exports.default = DepartmentChat;
//# sourceMappingURL=MSG-DepartmentChat.model.js.map