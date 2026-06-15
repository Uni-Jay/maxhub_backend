import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ExamAttributes {
  id: bigint;
  uuid: string;
  courseId: bigint;
  examCode: string;
  examName: string;
  description?: string;
  totalQuestions: number;
  passingScore: number;
  duration: number;
  attempts: number;
  status: 'Draft' | 'Published' | 'Archived' | 'Disabled';
  createdById: bigint;
  deletedAt?: Date;
}

interface ExamCreationAttributes extends Optional<ExamAttributes, 'id' | 'uuid'> {}

export class Exam extends Model<ExamAttributes, ExamCreationAttributes>
  implements ExamAttributes {
  public id!: bigint;
  public uuid!: string;
  public courseId!: bigint;
  public examCode!: string;
  public examName!: string;
  public description?: string;
  public totalQuestions!: number;
  public passingScore!: number;
  public duration!: number;
  public attempts!: number;
  public status!: 'Draft' | 'Published' | 'Archived' | 'Disabled';
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Exam {
    Exam.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course ID' },
        examCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Exam code' },
        examName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Exam name' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Exam description' },
        totalQuestions: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Total questions' },
        passingScore: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Passing score %' },
        duration: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Duration in minutes' },
        attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1, comment: 'Max attempts' },
        status: { type: DataTypes.ENUM('Draft', 'Published', 'Archived', 'Disabled'), defaultValue: 'Draft' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'exams', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['courseId'], name: 'idx_exams_courseId' },
          { fields: ['examCode'], name: 'idx_exams_examCode' },
          { fields: ['status'], name: 'idx_exams_status' },
          { fields: ['createdById'], name: 'idx_exams_createdById' },
          { fields: ['uuid'], name: 'idx_exams_uuid' },
        ],
        comment: 'Exams/assessments'
      }
    );
    return Exam;
  }
}
