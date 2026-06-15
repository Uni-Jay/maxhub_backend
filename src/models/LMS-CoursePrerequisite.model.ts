import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Course Prerequisite Model [MISSING]
 * Define course prerequisite relationships
 */
export interface ICoursePrerequisite {
  id: bigint;
  organizationId: bigint;
  courseId: bigint;
  prerequisiteCourseId: bigint;
  isRequired: boolean; // true = required, false = recommended
  createdAt: Date;
  updatedAt: Date;
}

export class CoursePrerequisite extends Model<ICoursePrerequisite> implements ICoursePrerequisite {
  declare id: bigint;
  declare organizationId: bigint;
  declare courseId: bigint;
  declare prerequisiteCourseId: bigint;
  declare isRequired: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

CoursePrerequisite.init(
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
    courseId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Course',
    },
    prerequisiteCourseId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Course (prerequisite)',
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'course_prerequisite',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['organizationId', 'courseId'] },
      { fields: ['prerequisiteCourseId'] },
      {
        fields: ['courseId', 'prerequisiteCourseId'],
        unique: true,
        name: 'uq_prerequisite_pair',
      },
    ],
  }
);

export default CoursePrerequisite;
