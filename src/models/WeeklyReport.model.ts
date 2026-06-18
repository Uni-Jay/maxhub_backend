import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface TaskStatusCounts {
  assigned: number;
  inProgress: number;
  completed: number;
  delayed: number;
  blocked: number;
}

interface AttachmentRef {
  url: string;
  publicId: string;
  name?: string;
}

interface WeeklyReportAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  weekEnding: string;
  accomplishments: string;
  challenges: string;
  nextWeekPlans: string;
  hoursWorked?: number;
  hasBlocker: boolean;
  blockerNotes?: string;
  taskStatus?: TaskStatusCounts;
  attachments?: AttachmentRef[];
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedById?: bigint;
  approvedDate?: Date;
  rejectionReason?: string;
  comments?: string;
  deletedAt?: Date;
}

interface WeeklyReportCreationAttributes
  extends Optional<WeeklyReportAttributes, 'id' | 'uuid' | 'hasBlocker' | 'approvalStatus'> {}

export class WeeklyReport
  extends Model<WeeklyReportAttributes, WeeklyReportCreationAttributes>
  implements WeeklyReportAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public weekEnding!: string;
  public accomplishments!: string;
  public challenges!: string;
  public nextWeekPlans!: string;
  public hoursWorked?: number;
  public hasBlocker!: boolean;
  public blockerNotes?: string;
  public taskStatus?: TaskStatusCounts;
  public attachments?: AttachmentRef[];
  public approvalStatus!: 'Pending' | 'Approved' | 'Rejected';
  public approvedById?: bigint;
  public approvedDate?: Date;
  public rejectionReason?: string;
  public comments?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof WeeklyReport {
    WeeklyReport.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        staffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Reference to staff table' },
        weekEnding: { type: DataTypes.DATEONLY, allowNull: false, comment: 'Friday of the reporting week' },
        accomplishments: { type: DataTypes.TEXT, allowNull: false },
        challenges: { type: DataTypes.TEXT, allowNull: false },
        nextWeekPlans: { type: DataTypes.TEXT, allowNull: false },
        hoursWorked: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        hasBlocker: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        blockerNotes: { type: DataTypes.TEXT, allowNull: true },
        taskStatus: { type: DataTypes.JSON, allowNull: true, comment: '{ assigned, inProgress, completed, delayed, blocked }' },
        attachments: { type: DataTypes.JSON, allowNull: true, comment: 'Array of { url, publicId, name }' },
        approvalStatus: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), allowNull: false, defaultValue: 'Pending' },
        approvedById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reference to users table' },
        approvedDate: { type: DataTypes.DATE, allowNull: true },
        rejectionReason: { type: DataTypes.TEXT, allowNull: true },
        comments: { type: DataTypes.TEXT, allowNull: true, comment: 'Super Admin feedback, independent of approve/reject' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'weekly_reports', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['staffId', 'weekEnding'], unique: true, name: 'idx_weekly_reports_staff_week' },
          { fields: ['approvalStatus'], name: 'idx_weekly_reports_approvalStatus' },
        ],
        comment: 'Weekly status reports submitted by staff, reviewed by Super Admin',
      }
    );
    return WeeklyReport;
  }
}
