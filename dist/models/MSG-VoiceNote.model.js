"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceNote = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class VoiceNote extends sequelize_1.Model {
}
exports.VoiceNote = VoiceNote;
VoiceNote.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    directMessageId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to DirectMessage',
    },
    chatMessageId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to ChatMessage',
    },
    voiceUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Duration in seconds',
    },
    fileSize: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'File size in bytes',
    },
    transcription: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    transcriptionStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Completed', 'Failed'),
        defaultValue: 'Pending',
    },
    uploadedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    uploadedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
    },
    playedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    playCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    isBookmarked: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
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
    tableName: 'voice_note',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId'] },
        { fields: ['directMessageId'] },
        { fields: ['chatMessageId'] },
        { fields: ['transcriptionStatus'] },
        { fields: ['uploadedAt'] },
    ],
});
exports.default = VoiceNote;
//# sourceMappingURL=MSG-VoiceNote.model.js.map