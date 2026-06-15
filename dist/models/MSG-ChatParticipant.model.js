"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatParticipant = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ChatParticipant extends sequelize_1.Model {
}
exports.ChatParticipant = ChatParticipant;
ChatParticipant.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    departmentChatId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to DepartmentChat',
    },
    staffId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('Admin', 'Moderator', 'Member'),
        defaultValue: 'Member',
        comment: 'NEW: Role-based permissions in chat',
    },
    joinedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    leftAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    isMuted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    muteNotifications: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    lastReadAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    unreadCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'NEW: Denormalized for O(1) inbox queries',
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
    tableName: 'chat_participant',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'departmentChatId'] },
        { fields: ['staffId'] },
        { fields: ['role'] },
        {
            fields: ['departmentChatId', 'staffId'],
            unique: true,
            where: { deletedAt: null, leftAt: null },
            name: 'uq_active_participant',
        },
    ],
});
exports.default = ChatParticipant;
//# sourceMappingURL=MSG-ChatParticipant.model.js.map