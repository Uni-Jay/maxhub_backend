import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface CourseContentAttributes {
  id: bigint;
  uuid: string;
  moduleId: bigint;
  contentType: 'Video' | 'Document' | 'Quiz' | 'Assignment' | 'Resource' | 'Interactive';
  contentTitle: string;
  description?: string;
  contentUrl: string;
  sequence: number;
  duration?: number;
  isRequired: boolean;
  status: 'Draft' | 'Published' | 'Archived';
  deletedAt?: Date;
}

interface CourseContentCreationAttributes extends Optional<CourseContentAttributes, 'id' | 'uuid'> {}

export class CourseContent extends Model<CourseContentAttributes, CourseContentCreationAttributes>
  implements CourseContentAttributes {
  public id!: bigint;
  public uuid!: string;
  public moduleId!: bigint;
  public contentType!: 'Video' | 'Document' | 'Quiz' | 'Assignment' | 'Resource' | 'Interactive';
  public contentTitle!: string;
  public description?: string;
  public contentUrl!: string;
  public sequence!: number;
  public duration?: number;
  public isRequired!: boolean;
  public status!: 'Draft' | 'Published' | 'Archived';
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof CourseContent {
    CourseContent.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        moduleId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course module ID' },
        contentType: { type: DataTypes.ENUM('Video', 'Document', 'Quiz', 'Assignment', 'Resource', 'Interactive'), allowNull: false },
        contentTitle: { type: DataTypes.STRING(300), allowNull: false, comment: 'Content title' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        contentUrl: { type: DataTypes.TEXT, allowNull: false, comment: 'URL to content' },
        sequence: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Display sequence' },
        duration: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Duration in minutes' },
        isRequired: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is required for completion' },
        status: { type: DataTypes.ENUM('Draft', 'Published', 'Archived'), defaultValue: 'Draft' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'course_contents', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['moduleId'], name: 'idx_course_contents_moduleId' },
          { fields: ['contentType'], name: 'idx_course_contents_contentType' },
          { fields: ['status'], name: 'idx_course_contents_status' },
          { fields: ['sequence'], name: 'idx_course_contents_sequence' },
          { fields: ['uuid'], name: 'idx_course_contents_uuid' },
        ],
        comment: 'Course content items'
      }
    );
    return CourseContent;
  }
}
