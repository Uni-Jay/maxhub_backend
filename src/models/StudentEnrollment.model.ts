import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type EnrollmentStatus = 'Active' | 'Completed' | 'Dropped' | 'Pending' | 'Suspended';

interface StudentEnrollmentAttributes {
  id: bigint;
  uuid: string;
  studentId: bigint;
  courseId: bigint;
  programId?: bigint;
  enrolledById?: bigint;
  enrolledAt: Date;
  completedAt?: Date;
  droppedAt?: Date;
  dropReason?: string;
  status: EnrollmentStatus;
  progressPercentage: number;
  grade?: string;
  gradePoints?: number;
  isCertificateIssued: boolean;
  certificateIssuedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentEnrollmentCreationAttributes
  extends Optional<
    StudentEnrollmentAttributes,
    'id' | 'uuid' | 'status' | 'progressPercentage' | 'isCertificateIssued' | 'enrolledAt'
  > {}

export class StudentEnrollment
  extends Model<StudentEnrollmentAttributes, StudentEnrollmentCreationAttributes>
  implements StudentEnrollmentAttributes
{
  public id!: bigint;
  public uuid!: string;
  public studentId!: bigint;
  public courseId!: bigint;
  public programId?: bigint;
  public enrolledById?: bigint;
  public enrolledAt!: Date;
  public completedAt?: Date;
  public droppedAt?: Date;
  public dropReason?: string;
  public status!: EnrollmentStatus;
  public progressPercentage!: number;
  public grade?: string;
  public gradePoints?: number;
  public isCertificateIssued!: boolean;
  public certificateIssuedAt?: Date;
  public notes?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StudentEnrollment {
    StudentEnrollment.init(
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
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        programId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        enrolledById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        enrolledAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        completedAt: { type: DataTypes.DATE, allowNull: true },
        droppedAt: { type: DataTypes.DATE, allowNull: true },
        dropReason: { type: DataTypes.TEXT, allowNull: true },
        status: {
          type: DataTypes.ENUM('Active', 'Completed', 'Dropped', 'Pending', 'Suspended'),
          allowNull: false,
          defaultValue: 'Active',
        },
        progressPercentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        grade: { type: DataTypes.STRING(10), allowNull: true },
        gradePoints: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
        isCertificateIssued: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        certificateIssuedAt: { type: DataTypes.DATE, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        modelName: 'StudentEnrollment',
        tableName: 'student_enrollments',
        timestamps: true,
        indexes: [
          { fields: ['studentId'] },
          { fields: ['courseId'] },
          { fields: ['programId'] },
          { fields: ['status'] },
          { unique: true, fields: ['studentId', 'courseId'] },
        ],
      }
    );
    return StudentEnrollment;
  }
}

export default StudentEnrollment;
