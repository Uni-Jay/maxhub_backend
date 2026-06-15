import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface FeedbackAttributes {
  id: bigint;
  uuid: string;
  feedbackCode: string;
  employeeId: bigint;
  givenBy: bigint;
  feedbackType: 'Positive' | 'Constructive' | 'Neutral';
  category: string;
  subject?: string;
  comment: string;
  isAnonymous: boolean;
  isPublic: boolean;
  acknowledgement?: string;
  acknowledgedDate?: Date;
  rating?: number;
  deletedAt?: Date;
}

interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'uuid'> {}

export class Feedback extends Model<FeedbackAttributes, FeedbackCreationAttributes>
  implements FeedbackAttributes {
  public id!: bigint;
  public uuid!: string;
  public feedbackCode!: string;
  public employeeId!: bigint;
  public givenBy!: bigint;
  public feedbackType!: 'Positive' | 'Constructive' | 'Neutral';
  public category!: string;
  public subject?: string;
  public comment!: string;
  public isAnonymous!: boolean;
  public isPublic!: boolean;
  public acknowledgement?: string;
  public acknowledgedDate?: Date;
  public rating?: number;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Feedback {
    Feedback.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        feedbackCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Feedback code' },
        employeeId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Employee/Staff ID' },
        givenBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Given by user ID' },
        feedbackType: { type: DataTypes.ENUM('Positive', 'Constructive', 'Neutral'), allowNull: false },
        category: { type: DataTypes.STRING(100), allowNull: false, comment: 'Category' },
        subject: { type: DataTypes.STRING(200), allowNull: true, comment: 'Subject' },
        comment: { type: DataTypes.TEXT, allowNull: false, comment: 'Feedback comment' },
        isAnonymous: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Anonymous feedback' },
        isPublic: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Public feedback' },
        acknowledgement: { type: DataTypes.TEXT, allowNull: true, comment: 'Acknowledgement' },
        acknowledgedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Acknowledgement date' },
        rating: { type: DataTypes.INTEGER, allowNull: true, comment: 'Rating 1-5' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'feedbacks', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['feedbackCode'], name: 'idx_feedbacks_feedbackCode' },
          { fields: ['employeeId'], name: 'idx_feedbacks_employeeId' },
          { fields: ['givenBy'], name: 'idx_feedbacks_givenBy' },
          { fields: ['feedbackType'], name: 'idx_feedbacks_feedbackType' },
          { fields: ['isAnonymous'], name: 'idx_feedbacks_isAnonymous' },
          { fields: ['uuid'], name: 'idx_feedbacks_uuid' },
        ],
        comment: 'Employee feedback'
      }
    );
    return Feedback;
  }
}
