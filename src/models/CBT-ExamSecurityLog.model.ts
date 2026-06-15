import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Exam Security Log Model [MISSING]
 * Track suspicious behavior during exam (cheating detection)
 */
export interface IExamSecurityLog {
  id: bigint;
  organizationId: bigint;
  examAttemptId: bigint;
  eventType: 'TabSwitch' | 'IPChange' | 'CopyPaste' | 'ScreenShare' | 'DevTools' | 'Refresh';
  description?: string;
  flaggedAs: 'Normal' | 'Suspicious' | 'Flagged';
  detectedAt: Date;
  detectedBy: string; // System or proctorId
  severity: 'Info' | 'Warning' | 'Critical';
  createdAt: Date;
  updatedAt: Date;
}

export class ExamSecurityLog extends Model<IExamSecurityLog> implements IExamSecurityLog {
  declare id: bigint;
  declare organizationId: bigint;
  declare examAttemptId: bigint;
  declare eventType: 'TabSwitch' | 'IPChange' | 'CopyPaste' | 'ScreenShare' | 'DevTools' | 'Refresh';
  declare description?: string;
  declare flaggedAs: 'Normal' | 'Suspicious' | 'Flagged';
  declare detectedAt: Date;
  declare detectedBy: string;
  declare severity: 'Info' | 'Warning' | 'Critical';
  declare createdAt: Date;
  declare updatedAt: Date;
}

ExamSecurityLog.init(
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
    examAttemptId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to StudentExamAttempt',
    },
    eventType: {
      type: DataTypes.ENUM('TabSwitch', 'IPChange', 'CopyPaste', 'ScreenShare', 'DevTools', 'Refresh'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    flaggedAs: {
      type: DataTypes.ENUM('Normal', 'Suspicious', 'Flagged'),
      defaultValue: 'Normal',
    },
    detectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    detectedBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'System or proctorId',
    },
    severity: {
      type: DataTypes.ENUM('Info', 'Warning', 'Critical'),
      defaultValue: 'Info',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'exam_security_log',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['organizationId', 'examAttemptId'] },
      { fields: ['eventType'] },
      { fields: ['flaggedAs'] },
      { fields: ['severity'] },
      { fields: ['detectedAt'] },
    ],
  }
);

export default ExamSecurityLog;
