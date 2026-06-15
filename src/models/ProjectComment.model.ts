import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ProjectCommentAttributes {
  id: bigint;
  uuid: string;
  taskId: bigint;
  projectId: bigint;
  staffId: bigint;
  content: string;
  mentionedStaffIds?: string; // JSON array of mentioned staff IDs
  parentCommentId?: bigint;
  isResolved: boolean;
  resolvedBy?: bigint;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface ProjectCommentCreationAttributes extends Optional<ProjectCommentAttributes, 'id' | 'uuid'> {}

export class ProjectComment
  extends Model<ProjectCommentAttributes, ProjectCommentCreationAttributes>
  implements ProjectCommentAttributes
{
  public id!: bigint;
  public uuid!: string;
  public taskId!: bigint;
  public projectId!: bigint;
  public staffId!: bigint;
  public content!: string;
  public mentionedStaffIds?: string;
  public parentCommentId?: bigint;
  public isResolved!: boolean;
  public resolvedBy?: bigint;
  public resolvedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof ProjectComment {
    ProjectComment.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: uuidv4,
        },
        taskId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'task',
            key: 'id',
          },
        },
        projectId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'project',
            key: 'id',
          },
        },
        staffId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        mentionedStaffIds: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        parentCommentId: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'project_comment',
            key: 'id',
          },
        },
        isResolved: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        resolvedBy: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        resolvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'project_comment',
        tableName: 'project_comment',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['taskId'],
          },
          {
            fields: ['projectId'],
          },
          {
            fields: ['staffId'],
          },
          {
            fields: ['isResolved'],
          },
        ],
      }
    );
    return ProjectComment;
  }
}
