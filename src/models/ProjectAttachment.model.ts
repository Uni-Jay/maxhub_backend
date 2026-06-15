import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ProjectAttachmentAttributes {
  id: bigint;
  uuid: string;
  projectId?: bigint;
  taskId?: bigint;
  commentId?: bigint;
  staffId: bigint;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // MIME type
  fileUrl: string;
  s3Key?: string;
  attachmentType: 'Document' | 'Image' | 'Video' | 'Audio' | 'Other';
  description?: string;
  uploadedAt: Date;
  downloadCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface ProjectAttachmentCreationAttributes extends Optional<ProjectAttachmentAttributes, 'id' | 'uuid'> {}

export class ProjectAttachment
  extends Model<ProjectAttachmentAttributes, ProjectAttachmentCreationAttributes>
  implements ProjectAttachmentAttributes
{
  public id!: bigint;
  public uuid!: string;
  public projectId?: bigint;
  public taskId?: bigint;
  public commentId?: bigint;
  public staffId!: bigint;
  public fileName!: string;
  public fileSize!: number;
  public fileType!: string;
  public fileUrl!: string;
  public s3Key?: string;
  public attachmentType!: 'Document' | 'Image' | 'Video' | 'Audio' | 'Other';
  public description?: string;
  public uploadedAt!: Date;
  public downloadCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof ProjectAttachment {
    ProjectAttachment.init(
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
        projectId: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'project',
            key: 'id',
          },
        },
        taskId: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'task',
            key: 'id',
          },
        },
        commentId: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'project_comment',
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
        fileName: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        fileSize: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        fileType: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        fileUrl: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        s3Key: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        attachmentType: {
          type: DataTypes.ENUM('Document', 'Image', 'Video', 'Audio', 'Other'),
          allowNull: false,
          defaultValue: 'Document',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        uploadedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        downloadCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: 'project_attachment',
        tableName: 'project_attachment',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['projectId'],
          },
          {
            fields: ['taskId'],
          },
          {
            fields: ['commentId'],
          },
          {
            fields: ['staffId'],
          },
        ],
      }
    );
    return ProjectAttachment;
  }
}
