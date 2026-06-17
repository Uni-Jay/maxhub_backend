import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface JobSyncLogAttributes {
  id: bigint;
  uuid: string;
  jobPostingId: bigint;
  businessUnit: string;
  action: 'Create' | 'Update' | 'Delete';
  status: 'Success' | 'Failed';
  httpStatusCode?: number;
  errorMessage?: string;
  attemptNumber: number;
}

interface JobSyncLogCreationAttributes extends Optional<JobSyncLogAttributes, 'id' | 'uuid'> {}

export class JobSyncLog extends Model<JobSyncLogAttributes, JobSyncLogCreationAttributes>
  implements JobSyncLogAttributes {
  public id!: bigint;
  public uuid!: string;
  public jobPostingId!: bigint;
  public businessUnit!: string;
  public action!: 'Create' | 'Update' | 'Delete';
  public status!: 'Success' | 'Failed';
  public httpStatusCode?: number;
  public errorMessage?: string;
  public attemptNumber!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof JobSyncLog {
    JobSyncLog.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        jobPostingId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Reference to job_postings table' },
        businessUnit: { type: DataTypes.STRING(10), allowNull: false, comment: 'Snapshot of the business unit at sync time (KS/VM/BM)' },
        action: { type: DataTypes.ENUM('Create', 'Update', 'Delete'), allowNull: false },
        status: { type: DataTypes.ENUM('Success', 'Failed'), allowNull: false },
        httpStatusCode: { type: DataTypes.INTEGER, allowNull: true },
        errorMessage: { type: DataTypes.TEXT, allowNull: true },
        attemptNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      },
      {
        sequelize, tableName: 'job_sync_logs', timestamps: true, paranoid: false, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['jobPostingId'], name: 'idx_job_sync_logs_jobPostingId' },
          { fields: ['status'], name: 'idx_job_sync_logs_status' },
        ],
        comment: 'Audit trail of job posting sync attempts to external business unit portals',
      }
    );
    return JobSyncLog;
  }
}
