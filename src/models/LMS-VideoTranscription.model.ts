import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Video Transcription Model [NEW - EXTRACTED FROM VIDEO]
 * Separate transcriptions for versioning and multi-language support
 * 
 * IMPROVEMENTS:
 * - Extract from Video LONGTEXT to separate table
 * - Support transcription versioning
 * - Enable async transcription processing
 * - Track transcription confidence and quality
 */
export interface IVideoTranscription {
  id: bigint;
  organizationId: bigint;
  videoId: bigint;
  language: string;
  languageCode: string;
  transcriptionText: string; // LONGTEXT
  transcriptionFormat: 'Plain' | 'VTT' | 'SRT' | 'JSON';
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  processedAt?: Date;
  processedBy?: string; // Service name
  confidence?: number; // 0-1 confidence score
  wordCount?: number;
  characterCount?: number;
  uploadedAt: Date;
  createdBy: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class VideoTranscription extends Model<IVideoTranscription> implements IVideoTranscription {
  declare id: bigint;
  declare organizationId: bigint;
  declare videoId: bigint;
  declare language: string;
  declare languageCode: string;
  declare transcriptionText: string;
  declare transcriptionFormat: 'Plain' | 'VTT' | 'SRT' | 'JSON';
  declare status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  declare processedAt?: Date;
  declare processedBy?: string;
  declare confidence?: number;
  declare wordCount?: number;
  declare characterCount?: number;
  declare uploadedAt: Date;
  declare createdBy: bigint;
  declare updatedBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

VideoTranscription.init(
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
    },
    languageCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    transcriptionText: {
      type: DataTypes.LONGTEXT,
      allowNull: false,
    },
    transcriptionFormat: {
      type: DataTypes.ENUM('Plain', 'VTT', 'SRT', 'JSON'),
      defaultValue: 'Plain',
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Failed'),
      defaultValue: 'Pending',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Service that processed transcription (Google Cloud Speech, etc.)',
    },
    confidence: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'Transcription confidence score 0-1',
    },
    wordCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    characterCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
  }
);

export default VideoTranscription;
