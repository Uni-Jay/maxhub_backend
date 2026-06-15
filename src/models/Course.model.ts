import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface CourseAttributes {
  id: bigint;
  uuid: string;
  courseCode: string;
  title: string;
  description?: string;
  departmentId?: bigint;
  instructorId: bigint;
  categoryId?: bigint;
  duration: number;
  maxParticipants?: number;
  minParticipants?: number;
  fee?: number;
  startDate: Date;
  endDate?: Date;
  status: 'Draft' | 'Published' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Archived';
  certificateRequired?: boolean;
  passingScore?: number;
  createdById: bigint;
  deletedAt?: Date;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'uuid'> {}

export class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: bigint;
  public uuid!: string;
  public courseCode!: string;
  public title!: string;
  public description?: string;
  public departmentId?: bigint;
  public instructorId!: bigint;
  public categoryId?: bigint;
  public duration!: number;
  public maxParticipants?: number;
  public minParticipants?: number;
  public fee?: number;
  public startDate!: Date;
  public endDate?: Date;
  public status!: 'Draft' | 'Published' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Archived';
  public certificateRequired?: boolean;
  public passingScore?: number;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Course {
    Course.init(
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
          unique: true,
          allowNull: false,
        },
        courseCode: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
          comment: 'Unique course code',
        },
        title: {
          type: DataTypes.STRING(300),
          allowNull: false,
          comment: 'Course title',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Course overview',
        },
        departmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to departments table',
        },
        instructorId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to staff table',
        },
        categoryId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Course category',
        },
        duration: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          comment: 'Duration in hours',
        },
        maxParticipants: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          comment: 'Maximum participants',
        },
        minParticipants: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          comment: 'Minimum participants to start',
        },
        fee: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Course fee',
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Course start date',
        },
        endDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Course end date',
        },
        status: {
          type: DataTypes.ENUM('Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled', 'Archived'),
          defaultValue: 'Draft',
          allowNull: false,
          comment: 'Course status',
        },
        certificateRequired: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Certificate required for completion',
        },
        passingScore: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          validate: { min: 0, max: 100 },
          comment: 'Passing score percentage',
        },
        createdById: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'User who created course',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'courses',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          { fields: ['courseCode'], name: 'idx_courses_courseCode' },
          { fields: ['instructorId'], name: 'idx_courses_instructorId' },
          { fields: ['departmentId'], name: 'idx_courses_departmentId' },
          { fields: ['status'], name: 'idx_courses_status' },
          { fields: ['startDate'], name: 'idx_courses_startDate' },
          { fields: ['uuid'], name: 'idx_courses_uuid' },
        ],
        comment: 'Learning management courses',
      }
    );
    return Course;
  }

  public isEnrollmentOpen(): boolean {
    const now = new Date();
    return this.status !== 'Cancelled' && now < this.startDate;
  }

  public isOngoing(): boolean {
    const now = new Date();
    return this.status === 'Ongoing' && now >= this.startDate && (!this.endDate || now <= this.endDate);
  }
}
