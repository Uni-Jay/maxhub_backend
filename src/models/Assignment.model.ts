import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AssignmentAttributes {
  id: bigint;
  uuid: string;
  courseId: bigint;
  assignmentCode: string;
  assignmentName: string;
  description?: string;
  points: number;
  dueDate: Date;
  allowLateSubmission: boolean;
  latePenaltyPercentage?: number;
  submissionType: 'File' | 'Text' | 'Link' | 'Quiz';
  maxFileSize?: number;
  allowedFileTypes?: string;
  status: 'Draft' | 'Published' | 'Closed' | 'Archived';
  createdById: bigint;
  deletedAt?: Date;
}

interface AssignmentCreationAttributes extends Optional<AssignmentAttributes, 'id' | 'uuid'> {}

export class Assignment extends Model<AssignmentAttributes, AssignmentCreationAttributes>
  implements AssignmentAttributes {
  public id!: bigint;
  public uuid!: string;
  public courseId!: bigint;
  public assignmentCode!: string;
  public assignmentName!: string;
  public description?: string;
  public points!: number;
  public dueDate!: Date;
  public allowLateSubmission!: boolean;
  public latePenaltyPercentage?: number;
  public submissionType!: 'File' | 'Text' | 'Link' | 'Quiz';
  public maxFileSize?: number;
  public allowedFileTypes?: string;
  public status!: 'Draft' | 'Published' | 'Closed' | 'Archived';
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Assignment {
    Assignment.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course ID' },
        assignmentCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Assignment code' },
        assignmentName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Assignment name' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        points: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Total points' },
        dueDate: { type: DataTypes.DATE, allowNull: false, comment: 'Due date' },
        allowLateSubmission: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Allow late submission' },
        latePenaltyPercentage: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Late penalty %' },
        submissionType: { type: DataTypes.ENUM('File', 'Text', 'Link', 'Quiz'), allowNull: false },
        maxFileSize: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Max file size in MB' },
        allowedFileTypes: { type: DataTypes.STRING(200), allowNull: true, comment: 'Allowed file types' },
        status: { type: DataTypes.ENUM('Draft', 'Published', 'Closed', 'Archived'), defaultValue: 'Draft' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'assignments', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['courseId'], name: 'idx_assignments_courseId' },
          { fields: ['assignmentCode'], name: 'idx_assignments_assignmentCode' },
          { fields: ['dueDate'], name: 'idx_assignments_dueDate' },
          { fields: ['status'], name: 'idx_assignments_status' },
          { fields: ['createdById'], name: 'idx_assignments_createdById' },
          { fields: ['uuid'], name: 'idx_assignments_uuid' },
        ],
        comment: 'Course assignments'
      }
    );
    return Assignment;
  }
}
