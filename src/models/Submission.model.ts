import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface SubmissionAttributes {
  id: bigint;
  uuid: string;
  assignmentId: bigint;
  enrollmentId: bigint;
  submissionText?: string;
  submissionUrl?: string;
  submissionFile?: string;
  submittedAt: Date;
  isLate: boolean;
  scoredPoints?: number;
  feedback?: string;
  reviewedBy?: bigint;
  reviewedAt?: Date;
  status: 'Draft' | 'Submitted' | 'Reviewed' | 'Returned' | 'Late';
  deletedAt?: Date;
}

interface SubmissionCreationAttributes extends Optional<SubmissionAttributes, 'id' | 'uuid'> {}

export class Submission extends Model<SubmissionAttributes, SubmissionCreationAttributes>
  implements SubmissionAttributes {
  public id!: bigint;
  public uuid!: string;
  public assignmentId!: bigint;
  public enrollmentId!: bigint;
  public submissionText?: string;
  public submissionUrl?: string;
  public submissionFile?: string;
  public submittedAt!: Date;
  public isLate!: boolean;
  public scoredPoints?: number;
  public feedback?: string;
  public reviewedBy?: bigint;
  public reviewedAt?: Date;
  public status!: 'Draft' | 'Submitted' | 'Reviewed' | 'Returned' | 'Late';
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Submission {
    Submission.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        assignmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Assignment ID' },
        enrollmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Enrollment ID' },
        submissionText: { type: DataTypes.TEXT, allowNull: true, comment: 'Text submission' },
        submissionUrl: { type: DataTypes.TEXT, allowNull: true, comment: 'URL submission' },
        submissionFile: { type: DataTypes.TEXT, allowNull: true, comment: 'File URL' },
        submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Submission date' },
        isLate: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is late submission' },
        scoredPoints: { type: DataTypes.DECIMAL(5, 2), allowNull: true, comment: 'Points scored' },
        feedback: { type: DataTypes.TEXT, allowNull: true, comment: 'Feedback from reviewer' },
        reviewedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reviewed by user ID' },
        reviewedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Review date' },
        status: { type: DataTypes.ENUM('Draft', 'Submitted', 'Reviewed', 'Returned', 'Late'), defaultValue: 'Draft' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'submissions', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['assignmentId'], name: 'idx_submissions_assignmentId' },
          { fields: ['enrollmentId'], name: 'idx_submissions_enrollmentId' },
          { fields: ['status'], name: 'idx_submissions_status' },
          { fields: ['submittedAt'], name: 'idx_submissions_submittedAt' },
          { fields: ['assignmentId', 'enrollmentId'], name: 'idx_submissions_assignment_enrollment' },
          { fields: ['uuid'], name: 'idx_submissions_uuid' },
        ],
        comment: 'Assignment submissions'
      }
    );
    return Submission;
  }
}
