import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface CourseModuleAttributes {
  id: bigint;
  uuid: string;
  courseId: bigint;
  moduleCode: string;
  moduleName: string;
  description?: string;
  sequence: number;
  duration: number;
  status: 'Draft' | 'Published' | 'Archived';
  deletedAt?: Date;
}

interface CourseModuleCreationAttributes extends Optional<CourseModuleAttributes, 'id' | 'uuid'> {}

export class CourseModule extends Model<CourseModuleAttributes, CourseModuleCreationAttributes>
  implements CourseModuleAttributes {
  public id!: bigint;
  public uuid!: string;
  public courseId!: bigint;
  public moduleCode!: string;
  public moduleName!: string;
  public description?: string;
  public sequence!: number;
  public duration!: number;
  public status!: 'Draft' | 'Published' | 'Archived';
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof CourseModule {
    CourseModule.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Course ID' },
        moduleCode: { type: DataTypes.STRING(50), allowNull: false, comment: 'Module code' },
        moduleName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Module name' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Module description' },
        sequence: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Display sequence' },
        duration: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Duration in hours' },
        status: { type: DataTypes.ENUM('Draft', 'Published', 'Archived'), defaultValue: 'Draft' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'course_modules', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['courseId'], name: 'idx_course_modules_courseId' },
          { fields: ['moduleCode'], name: 'idx_course_modules_moduleCode' },
          { fields: ['status'], name: 'idx_course_modules_status' },
          { fields: ['sequence'], name: 'idx_course_modules_sequence' },
          { fields: ['uuid'], name: 'idx_course_modules_uuid' },
        ],
        comment: 'Course modules'
      }
    );
    return CourseModule;
  }
}
