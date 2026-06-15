"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Video = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class Video extends sequelize_1.Model {
}
exports.Video = Video;
Video.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    lessonId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Lesson',
    },
    videoTitle: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    videoUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    thumbnailUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
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
    videoType: {
        type: sequelize_1.DataTypes.ENUM('YouTube', 'Vimeo', 'Local', 'External'),
        defaultValue: 'Local',
    },
    transcription: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: true,
    },
    subtitles: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Array of { language, url, vttUrl }',
    },
    sequence: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Processing', 'Ready', 'Failed', 'Archived'),
        defaultValue: 'Processing',
    },
    uploadedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff who uploaded',
    },
    uploadedAt: {
        type: sequelize_1.DataTypes.DATE,
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
    tableName: 'video',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'lessonId'] },
        { fields: ['status'] },
        { fields: ['uploadedAt'] },
    ],
});
exports.default = Video;
//# sourceMappingURL=LMS-Video.model.js.map