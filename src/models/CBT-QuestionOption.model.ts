import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Question Option Model
 * Multiple choice options for questions
 */
export interface IQuestionOption {
  id: bigint;
  organizationId: bigint;
  questionId: bigint;
  optionLetter: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class QuestionOption extends Model<IQuestionOption> implements IQuestionOption {
  declare id: bigint;
  declare organizationId: bigint;
  declare questionId: bigint;
  declare optionLetter: string;
  declare optionText: string;
  declare isCorrect: boolean;
  declare order: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

QuestionOption.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    questionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Question',
    },
    optionLetter: {
      type: DataTypes.CHAR(1),
      allowNull: false,
    },
    optionText: {
      type: DataTypes.LONGTEXT,
      allowNull: false,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'question_option',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'questionId'] },
      { fields: ['isCorrect'] },
    ],
  }
);

export default QuestionOption;
