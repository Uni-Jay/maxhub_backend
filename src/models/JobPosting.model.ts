import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface JobPostingAttributes {
  id: bigint;
  uuid: string;
  jobCode: string;
  title: string;
  description?: string;
  departmentId: bigint;
  designationId: bigint;
  noOfPositions: number;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  location?: string;
  requiredExperience?: string;
  qualifications?: string;
  skills?: string;
  benefits?: string;
  postedDate: Date;
  closingDate: Date;
  createdById: bigint;
  status: 'Draft' | 'Open' | 'Closed' | 'OnHold' | 'Filled';
  deletedAt?: Date;
}

interface JobPostingCreationAttributes extends Optional<JobPostingAttributes, 'id' | 'uuid'> {}

export class JobPosting extends Model<JobPostingAttributes, JobPostingCreationAttributes>
  implements JobPostingAttributes {
  public id!: bigint;
  public uuid!: string;
  public jobCode!: string;
  public title!: string;
  public description?: string;
  public departmentId!: bigint;
  public designationId!: bigint;
  public noOfPositions!: number;
  public jobType!: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  public salaryMin?: number;
  public salaryMax?: number;
  public currency?: string;
  public location?: string;
  public requiredExperience?: string;
  public qualifications?: string;
  public skills?: string;
  public benefits?: string;
  public postedDate!: Date;
  public closingDate!: Date;
  public createdById!: bigint;
  public status!: 'Draft' | 'Open' | 'Closed' | 'OnHold' | 'Filled';
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof JobPosting {
    JobPosting.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        jobCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, comment: 'Job posting code' },
        title: { type: DataTypes.STRING(200), allowNull: false, comment: 'Job title' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Job description' },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Hiring department' },
        designationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job designation' },
        noOfPositions: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Number of positions' },
        jobType: { type: DataTypes.ENUM('Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'), allowNull: false },
        salaryMin: { type: DataTypes.DECIMAL(15, 2), allowNull: true, comment: 'Minimum salary' },
        salaryMax: { type: DataTypes.DECIMAL(15, 2), allowNull: true, comment: 'Maximum salary' },
        currency: { type: DataTypes.STRING(3), defaultValue: 'USD', allowNull: true },
        location: { type: DataTypes.STRING(200), allowNull: true, comment: 'Job location' },
        requiredExperience: { type: DataTypes.TEXT, allowNull: true, comment: 'Required experience' },
        qualifications: { type: DataTypes.TEXT, allowNull: true, comment: 'Required qualifications' },
        skills: { type: DataTypes.TEXT, allowNull: true, comment: 'Required skills' },
        benefits: { type: DataTypes.TEXT, allowNull: true, comment: 'Job benefits' },
        postedDate: { type: DataTypes.DATE, allowNull: false, comment: 'When job was posted' },
        closingDate: { type: DataTypes.DATE, allowNull: false, comment: 'Application closing date' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user' },
        status: { type: DataTypes.ENUM('Draft', 'Open', 'Closed', 'OnHold', 'Filled'), defaultValue: 'Draft' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'job_postings', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['jobCode'], name: 'idx_job_postings_jobCode' },
          { fields: ['status'], name: 'idx_job_postings_status' },
          { fields: ['departmentId'], name: 'idx_job_postings_departmentId' },
          { fields: ['closingDate'], name: 'idx_job_postings_closingDate' },
          { fields: ['uuid'], name: 'idx_job_postings_uuid' },
        ],
        comment: 'Job postings'
      }
    );
    return JobPosting;
  }

  public isActive(): boolean {
    return this.status === 'Open' && new Date() <= this.closingDate;
  }

  public isClosed(): boolean {
    return new Date() > this.closingDate || this.status === 'Closed' || this.status === 'Filled';
  }
}
