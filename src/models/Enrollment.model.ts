import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface EnrollmentAttributes {
  id: bigint;
  uuid: string;
  courseId: bigint;
  staffId: bigint;
  enrollmentDate: Date;
  completionDate?: Date;
  status: 'Enrolled' | 'InProgress' | 'Completed' | 'Failed' | 'Dropped' | 'OnHold';
  progressPercentage: number;
  certificateId?: bigint;
  notes?: string;
  deletedAt?: Date;
}

interface EnrollmentCreationAttributes extends Optional<EnrollmentAttributes, 'id' | 'uuid'> {}

export class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes>
  implements EnrollmentAttributes {
  public id!: bigint;
  public uuid!: string;
  public courseId!: bigint;
  public staffId!: bigint;
  public enrollmentDate!: Date;
  public completionDate?: Date;
  public status!: 'Enrolled' | 'InProgress' | 'Completed' | 'Failed' | 'Dropped' | 'OnHold';
  public progressPercentage!: number;
  public certificateId?: bigint;
  public notes?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Enrollment {
    Enrollment.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course ID' },
        staffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff/participant ID' },
        enrollmentDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Enrollment date' },
        completionDate: { type: DataTypes.DATE, allowNull: true, comment: 'Completion date' },
        status: { type: DataTypes.ENUM('Enrolled', 'InProgress', 'Completed', 'Failed', 'Dropped', 'OnHold'), defaultValue: 'Enrolled' },
        progressPercentage: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0, allowNull: false, comment: 'Progress 0-100' },
        certificateId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Certificate ID' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Notes' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'enrollments', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['courseId'], name: 'idx_enrollments_courseId' },
          { fields: ['staffId'], name: 'idx_enrollments_staffId' },
          { fields: ['status'], name: 'idx_enrollments_status' },
          { fields: ['enrollmentDate'], name: 'idx_enrollments_enrollmentDate' },
          { fields: ['courseId', 'staffId'], name: 'idx_enrollments_course_staff' },
          { fields: ['uuid'], name: 'idx_enrollments_uuid' },
        ],
        comment: 'Course enrollments'
      }
    );
    return Enrollment;
  }
}
