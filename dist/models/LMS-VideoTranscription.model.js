"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoTranscription = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class VideoTranscription extends sequelize_1.Model {
}
exports.VideoTranscription = VideoTranscription;
VideoTranscription.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    videoId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Video',
    },
    language: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    languageCode: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
    },
    transcriptionText: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: false,
    },
    transcriptionFormat: {
        type: sequelize_1.DataTypes.ENUM('Plain', 'VTT', 'SRT', 'JSON'),
        defaultValue: 'Plain',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Failed'),
        defaultValue: 'Pending',
    },
    processedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    processedBy: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        comment: 'Service that processed transcription (Google Cloud Speech, etc.)',
    },
    confidence: {
        type: sequelize_1.DataTypes.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Transcription confidence score 0-1',
    },
    wordCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    characterCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    uploadedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
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
    tableName: 'video_transcription',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'videoId'] },
        { fields: ['languageCode'] },
        { fields: ['status'] },
        { fields: ['processedAt'] },
        { fields: ['confidence'] },
    ],
});
exports.default = VideoTranscription;
//# sourceMappingURL=LMS-VideoTranscription.model.js.map