import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface QuestionAttributes {
  id: bigint;
  uuid: string;
  examId: bigint;
  questionType: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'Matching' | 'FillBlank';
  questionText: string;
  points: number;
  sequence: number;
  options?: string;
  correctAnswer: string;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Draft' | 'Active' | 'Archived';
  deletedAt?: Date;
}

interface QuestionCreationAttributes extends Optional<QuestionAttributes, 'id' | 'uuid'> {}

export class Question extends Model<QuestionAttributes, QuestionCreationAttributes>
  implements QuestionAttributes {
  public id!: bigint;
  public uuid!: string;
  public examId!: bigint;
  public questionType!: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'Matching' | 'FillBlank';
  public questionText!: string;
  public points!: number;
  public sequence!: number;
  public options?: string;
  public correctAnswer!: string;
  public explanation?: string;
  public difficulty!: 'Easy' | 'Medium' | 'Hard';
  public status!: 'Draft' | 'Active' | 'Archived';
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Question {
    Question.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        examId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Exam ID' },
        questionType: { type: DataTypes.ENUM('MultipleChoice', 'TrueFalse', 'ShortAnswer', 'Essay', 'Matching', 'FillBlank'), allowNull: false },
        questionText: { type: DataTypes.TEXT, allowNull: false, comment: 'Question text' },
        points: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Points for this question' },
        sequence: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Question sequence' },
        options: { type: DataTypes.JSON, allowNull: true, comment: 'Options for multiple choice (JSON array)' },
        correctAnswer: { type: DataTypes.TEXT, allowNull: false, comment: 'Correct answer' },
        explanation: { type: DataTypes.TEXT, allowNull: true, comment: 'Answer explanation' },
        difficulty: { type: DataTypes.ENUM('Easy', 'Medium', 'Hard'), defaultValue: 'Medium' },
        status: { type: DataTypes.ENUM('Draft', 'Active', 'Archived'), defaultValue: 'Draft' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'questions', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['examId'], name: 'idx_questions_examId' },
          { fields: ['questionType'], name: 'idx_questions_questionType' },
          { fields: ['difficulty'], name: 'idx_questions_difficulty' },
          { fields: ['status'], name: 'idx_questions_status' },
          { fields: ['uuid'], name: 'idx_questions_uuid' },
        ],
        comment: 'Exam questions'
      }
    );
    return Question;
  }
}
