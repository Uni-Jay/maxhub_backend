import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AppraisalAttributes {
  id: bigint;
  uuid: string;
  appraisalCode: string;
  staffId: bigint;
  appraisalPeriod: string;
  appraisalDate: Date;
  reviewerUserId: bigint;
  overallRating: number;
  performanceNotes?: string;
  strengths?: string;
  improvements?: string;
  status: 'Draft' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
  completedDate?: Date;
  approvedBy?: bigint;
  approvedDate?: Date;
  deletedAt?: Date;
}

interface AppraisalCreationAttributes extends Optional<AppraisalAttributes, 'id' | 'uuid'> {}

export class Appraisal extends Model<AppraisalAttributes, AppraisalCreationAttributes>
  implements AppraisalAttributes {
  public id!: bigint;
  public uuid!: string;
  public appraisalCode!: string;
  public staffId!: bigint;
  public appraisalPeriod!: string;
  public appraisalDate!: Date;
  public reviewerUserId!: bigint;
  public overallRating!: number;
  public performanceNotes?: string;
  public strengths?: string;
  public improvements?: string;
  public status!: 'Draft' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
  public completedDate?: Date;
  public approvedBy?: bigint;
  public approvedDate?: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Appraisal {
    Appraisal.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        appraisalCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Appraisal code' },
        staffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
        appraisalPeriod: { type: DataTypes.STRING(50), allowNull: false, comment: 'Period' },
        appraisalDate: { type: DataTypes.DATE, allowNull: false, comment: 'Appraisal date' },
        reviewerUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Reviewer user ID' },
        overallRating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, comment: 'Overall rating 1-5' },
        performanceNotes: { type: DataTypes.TEXT, allowNull: true, comment: 'Performance notes' },
        strengths: { type: DataTypes.TEXT, allowNull: true, comment: 'Strengths' },
        improvements: { type: DataTypes.TEXT, allowNull: true, comment: 'Improvements' },
        status: { type: DataTypes.ENUM('Draft', 'InProgress', 'Completed', 'Approved', 'Rejected'), defaultValue: 'Draft' },
        completedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Completion date' },
        approvedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Approved by user ID' },
        approvedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Approval date' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'appraisals', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['appraisalCode'], name: 'idx_appraisals_appraisalCode' },
          { fields: ['staffId'], name: 'idx_appraisals_staffId' },
          { fields: ['appraisalPeriod'], name: 'idx_appraisals_appraisalPeriod' },
          { fields: ['status'], name: 'idx_appraisals_status' },
          { fields: ['reviewerUserId'], name: 'idx_appraisals_reviewerUserId' },
          { fields: ['uuid'], name: 'idx_appraisals_uuid' },
        ],
        comment: 'Performance appraisals'
      }
    );
    return Appraisal;
  }
}
