import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Video Model
 * Video content for lessons
 */
export interface IVideo {
  id: bigint;
  organizationId: bigint;
  lessonId: bigint;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  videoType: 'YouTube' | 'Vimeo' | 'Local' | 'External';
  transcription?: string;
  subtitles?: JSON; // Array of { language, url }
  sequence: number;
  status: 'Processing' | 'Ready' | 'Failed' | 'Archived';
  uploadedBy?: bigint;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Video extends Model<IVideo> implements IVideo {
  declare id: bigint;
  declare organizationId: bigint;
  declare lessonId: bigint;
  declare videoTitle: string;
  declare videoUrl: string;
  declare thumbnailUrl?: string;
  declare duration: number;
  declare fileSize: number;
  declare videoType: 'YouTube' | 'Vimeo' | 'Local' | 'External';
  declare transcription?: string;
  declare subtitles?: JSON;
  declare sequence: number;
  declare status: 'Processing' | 'Ready' | 'Failed' | 'Archived';
  declare uploadedBy?: bigint;
  declare uploadedAt?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Video.init(
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
    lessonId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Lesson',
    },
    videoTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in seconds',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'File size in bytes',
    },
    videoType: {
      type: DataTypes.ENUM('YouTube', 'Vimeo', 'Local', 'External'),
      defaultValue: 'Local',
    },
    transcription: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    subtitles: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of { language, url, vttUrl }',
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Processing', 'Ready', 'Failed', 'Archived'),
      defaultValue: 'Processing',
    },
    uploadedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff who uploaded',
    },
    uploadedAt: {
      type: DataTypes.DATE,
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
    tableName: 'video',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'lessonId'] },
      { fields: ['status'] },
      { fields: ['uploadedAt'] },
    ],
  }
);

export default Video;
