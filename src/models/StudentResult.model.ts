import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type ResultType = 'Exam' | 'Assignment' | 'Quiz' | 'Project' | 'Practical';
export type ResultStatus = 'Pending' | 'Graded' | 'Published' | 'Appealed';

interface StudentResultAttributes {
  id: bigint;
  uuid: string;
  studentId: bigint;
  courseId?: bigint;
  examId?: bigint;
  assignmentId?: bigint;
  type: ResultType;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  gradePoints?: number;
  passed: boolean;
  passMark: number;
  attemptNumber: number;
  timeTakenMinutes?: number;
  feedback?: string;
  gradedById?: bigint;
  gradedAt?: Date;
  publishedAt?: Date;
  status: ResultStatus;
  appealReason?: string;
  appealReviewedBy?: bigint;
  appealReviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentResultCreationAttributes
  extends Optional<
    StudentResultAttributes,
    | 'id'
    | 'uuid'
    | 'status'
    | 'passed'
    | 'attemptNumber'
    | 'passMark'
    | 'percentage'
    | 'grade'
  > {}

export class StudentResult
  extends Model<StudentResultAttributes, StudentResultCreationAttributes>
  implements StudentResultAttributes
{
  public id!: bigint;
  public uuid!: string;
  public studentId!: bigint;
  public courseId?: bigint;
  public examId?: bigint;
  public assignmentId?: bigint;
  public type!: ResultType;
  public title!: string;
  public score!: number;
  public maxScore!: number;
  public percentage!: number;
  public grade!: string;
  public gradePoints?: number;
  public passed!: boolean;
  public passMark!: number;
  public attemptNumber!: number;
  public timeTakenMinutes?: number;
  public feedback?: string;
  public gradedById?: bigint;
  public gradedAt?: Date;
  public publishedAt?: Date;
  public status!: ResultStatus;
  public appealReason?: string;
  public appealReviewedBy?: bigint;
  public appealReviewedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StudentResult {
    StudentResult.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        uuid: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          allowNull: false,
          unique: true,
        },
        studentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        examId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        assignmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        type: {
          type: DataTypes.ENUM('Exam', 'Assignment', 'Quiz', 'Project', 'Practical'),
          allowNull: false,
        },
        title: { type: DataTypes.STRING(300), allowNull: false },
        score: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
        maxScore: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
        percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
        grade: { type: DataTypes.STRING(5), allowNull: false, defaultValue: 'F' },
        gradePoints: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
        passed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        passMark: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 50 },
        attemptNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
        timeTakenMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        feedback: { type: DataTypes.TEXT, allowNull: true },
        gradedById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        gradedAt: { type: DataTypes.DATE, allowNull: true },
        publishedAt: { type: DataTypes.DATE, allowNull: true },
        status: {
          type: DataTypes.ENUM('Pending', 'Graded', 'Published', 'Appealed'),
          allowNull: false,
          defaultValue: 'Pending',
        },
        appealReason: { type: DataTypes.TEXT, allowNull: true },
        appealReviewedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        appealReviewedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        modelName: 'StudentResult',
        tableName: 'student_results',
        timestamps: true,
        indexes: [
          { fields: ['studentId'] },
          { fields: ['courseId'] },
          { fields: ['examId'] },
          { fields: ['status'] },
          { fields: ['type'] },
        ],
      }
    );
    return StudentResult;
  }
}

export default StudentResult;
