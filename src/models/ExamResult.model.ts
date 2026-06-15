import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ExamResultAttributes {
  id: bigint;
  uuid: string;
  examId: bigint;
  enrollmentId: bigint;
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passingScore: number;
  status: 'InProgress' | 'Passed' | 'Failed' | 'Submitted';
  answers?: string;
  notes?: string;
  deletedAt?: Date;
}

interface ExamResultCreationAttributes extends Optional<ExamResultAttributes, 'id' | 'uuid'> {}

export class ExamResult extends Model<ExamResultAttributes, ExamResultCreationAttributes>
  implements ExamResultAttributes {
  public id!: bigint;
  public uuid!: string;
  public examId!: bigint;
  public enrollmentId!: bigint;
  public attemptNumber!: number;
  public startedAt!: Date;
  public completedAt?: Date;
  public totalQuestions!: number;
  public correctAnswers!: number;
  public score!: number;
  public passingScore!: number;
  public status!: 'InProgress' | 'Passed' | 'Failed' | 'Submitted';
  public answers?: string;
  public notes?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof ExamResult {
    ExamResult.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        examId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Exam ID' },
        enrollmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Enrollment ID' },
        attemptNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Attempt number' },
        startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'When started' },
        completedAt: { type: DataTypes.DATE, allowNull: true, comment: 'When completed' },
        totalQuestions: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Total questions' },
        correctAnswers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Correct answers' },
        score: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Score %' },
        passingScore: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Passing score %' },
        status: { type: DataTypes.ENUM('InProgress', 'Passed', 'Failed', 'Submitted'), defaultValue: 'InProgress' },
        answers: { type: DataTypes.JSON, allowNull: true, comment: 'User answers (JSON)' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Feedback/notes' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'exam_results', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['examId'], name: 'idx_exam_results_examId' },
          { fields: ['enrollmentId'], name: 'idx_exam_results_enrollmentId' },
          { fields: ['status'], name: 'idx_exam_results_status' },
          { fields: ['score'], name: 'idx_exam_results_score' },
          { fields: ['examId', 'enrollmentId'], name: 'idx_exam_results_exam_enrollment' },
          { fields: ['uuid'], name: 'idx_exam_results_uuid' },
        ],
        comment: 'Exam results/attempts'
      }
    );
    return ExamResult;
  }
}
