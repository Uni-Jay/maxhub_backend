import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ProjectCommentMentionAttributes {
  id: bigint;
  uuid: string;
  commentId: bigint;
  projectId: bigint;
  mentionedStaffId: bigint;
  mentionedBy: bigint;
  mentionedAt: Date;
  notified: boolean;
  notificationDeliveredAt?: Date;
  notificationRead: boolean;
  acknowledgedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface ProjectCommentMentionCreationAttributes
  extends Optional<ProjectCommentMentionAttributes, 'id' | 'uuid'> {}

export class ProjectCommentMention
  extends Model<ProjectCommentMentionAttributes, ProjectCommentMentionCreationAttributes>
  implements ProjectCommentMentionAttributes
{
  public id!: bigint;
  public uuid!: string;
  public commentId!: bigint;
  public projectId!: bigint;
  public mentionedStaffId!: bigint;
  public mentionedBy!: bigint;
  public mentionedAt!: Date;
  public notified!: boolean;
  public notificationDeliveredAt?: Date;
  public notificationRead!: boolean;
  public acknowledgedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof ProjectCommentMention {
    ProjectCommentMention.init(
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
        commentId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'project_comment',
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
        mentionedStaffId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        mentionedBy: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        mentionedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        notified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        notificationDeliveredAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        notificationRead: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        acknowledgedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'project_comment_mention',
        tableName: 'project_comment_mention',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['commentId', 'mentionedStaffId'],
            unique: true, // One mention per staff per comment
          },
          {
            fields: ['mentionedStaffId', 'notified'],
          },
          {
            fields: ['projectId', 'mentionedStaffId'],
          },
        ],
      }
    );
    return ProjectCommentMention;
  }
}
