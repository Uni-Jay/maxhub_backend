import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Video Subtitle Model [NEW - EXTRACTED FROM VIDEO]
 * Separate subtitles for multi-language support and versioning
 * 
 * IMPROVEMENTS:
 * - Extract from Video JSON to separate table
 * - Support language-specific queries
 * - Enable version history per language
 * - Support SRT format alongside JSON
 */
export interface IVideoSubtitle {
  id: bigint;
  organizationId: bigint;
  videoId: bigint;
  language: string;
  languageCode: string; // e.g., 'en', 'es', 'fr'
  vttUrl: string;
  srtUrl?: string; // NEW: Support for SRT format
  jsonUrl?: string;
  fileSize: number; // in bytes
  uploadedAt: Date;
  uploadedBy: bigint;
  isDefault: boolean; // Primary language
  status: 'Ready' | 'Processing' | 'Failed';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class VideoSubtitle extends Model<IVideoSubtitle> implements IVideoSubtitle {
  declare id: bigint;
  declare organizationId: bigint;
  declare videoId: bigint;
  declare language: string;
  declare languageCode: string;
  declare vttUrl: string;
  declare srtUrl?: string;
  declare jsonUrl?: string;
  declare fileSize: number;
  declare uploadedAt: Date;
  declare uploadedBy: bigint;
  declare isDefault: boolean;
  declare status: 'Ready' | 'Processing' | 'Failed';
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

VideoSubtitle.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    videoId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Video',
    },
    language: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Full language name (e.g., "English")',
    },
    languageCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'ISO language code (e.g., "en", "es", "fr")',
    },
    vttUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    srtUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'NEW: SRT format for broader compatibility',
    },
    jsonUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('Ready', 'Processing', 'Failed'),
      defaultValue: 'Ready',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
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
  }
);

export default VideoSubtitle;
