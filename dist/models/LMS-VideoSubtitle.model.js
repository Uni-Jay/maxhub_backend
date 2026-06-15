"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoSubtitle = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class VideoSubtitle extends sequelize_1.Model {
}
exports.VideoSubtitle = VideoSubtitle;
VideoSubtitle.init({
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
        comment: 'Full language name (e.g., "English")',
    },
    languageCode: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
        comment: 'ISO language code (e.g., "en", "es", "fr")',
    },
    vttUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    srtUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        comment: 'NEW: SRT format for broader compatibility',
    },
    jsonUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    fileSize: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
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
    isDefault: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Ready', 'Processing', 'Failed'),
        defaultValue: 'Ready',
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
    tableName: 'video_subtitle',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'videoId'] },
        { fields: ['languageCode'] },
        { fields: ['status'] },
        {
            fields: ['videoId', 'languageCode'],
            unique: true,
            where: { deletedAt: null },
            name: 'uq_video_language_subtitle',
        },
    ],
});
exports.default = VideoSubtitle;
//# sourceMappingURL=LMS-VideoSubtitle.model.js.map