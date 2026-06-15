import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 21: Messaging - Voice Note Model
 * Audio recordings and transcriptions
 */
export interface IVoiceNote {
  id: bigint;
  organizationId: bigint;
  directMessageId?: bigint;
  chatMessageId?: bigint;
  voiceUrl: string;
  duration: number; // in seconds
  fileSize: number;
  transcription?: string;
  transcriptionStatus: 'Pending' | 'Completed' | 'Failed';
  uploadedAt: Date;
  uploadedBy: bigint;
  playedAt?: Date;
  playCount: number;
  isBookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class VoiceNote extends Model<IVoiceNote> implements IVoiceNote {
  declare id: bigint;
  declare organizationId: bigint;
  declare directMessageId?: bigint;
  declare chatMessageId?: bigint;
  declare voiceUrl: string;
  declare duration: number;
  declare fileSize: number;
  declare transcription?: string;
  declare transcriptionStatus: 'Pending' | 'Completed' | 'Failed';
  declare uploadedAt: Date;
  declare uploadedBy: bigint;
  declare playedAt?: Date;
  declare playCount: number;
  declare isBookmarked: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

VoiceNote.init(
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
    directMessageId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to DirectMessage',
    },
    chatMessageId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to ChatMessage',
    },
    voiceUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
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
    transcription: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    transcriptionStatus: {
      type: DataTypes.ENUM('Pending', 'Completed', 'Failed'),
      defaultValue: 'Pending',
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
    playedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    playCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isBookmarked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
  }
);

export default VoiceNote;
