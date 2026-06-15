import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface JobApplicationAttributes {
  id: bigint;
  uuid: string;
  jobPostingId: bigint;
  contactId: bigint;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  applicationDate: Date;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Interviewed' | 'Offered' | 'Withdrawn';
  source?: string;
  notes?: string;
  deletedAt?: Date;
}

interface JobApplicationCreationAttributes extends Optional<JobApplicationAttributes, 'id' | 'uuid'> {}

export class JobApplication extends Model<JobApplicationAttributes, JobApplicationCreationAttributes>
  implements JobApplicationAttributes {
  public id!: bigint;
  public uuid!: string;
  public jobPostingId!: bigint;
  public contactId!: bigint;
  public applicantName!: string;
  public applicantEmail!: string;
  public applicantPhone!: string;
  public resumeUrl?: string;
  public coverLetterUrl?: string;
  public applicationDate!: Date;
  public status!: 'Applied' | 'Shortlisted' | 'Rejected' | 'Interviewed' | 'Offered' | 'Withdrawn';
  public source?: string;
  public notes?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof JobApplication {
    JobApplication.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        jobPostingId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job posting ID' },
        contactId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Contact/applicant ID' },
        applicantName: { type: DataTypes.STRING(150), allowNull: false, comment: 'Full name' },
        applicantEmail: { type: DataTypes.STRING(100), allowNull: false, comment: 'Email address' },
        applicantPhone: { type: DataTypes.STRING(20), allowNull: false, comment: 'Phone number' },
        resumeUrl: { type: DataTypes.TEXT, allowNull: true, comment: 'Resume URL' },
        coverLetterUrl: { type: DataTypes.TEXT, allowNull: true, comment: 'Cover letter URL' },
        applicationDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Application date' },
        status: { type: DataTypes.ENUM('Applied', 'Shortlisted', 'Rejected', 'Interviewed', 'Offered', 'Withdrawn'), defaultValue: 'Applied' },
        source: { type: DataTypes.STRING(100), allowNull: true, comment: 'Source (LinkedIn, etc)' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Recruiter notes' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'job_applications', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['jobPostingId'], name: 'idx_job_applications_jobPostingId' },
          { fields: ['contactId'], name: 'idx_job_applications_contactId' },
          { fields: ['status'], name: 'idx_job_applications_status' },
          { fields: ['applicantEmail'], name: 'idx_job_applications_applicantEmail' },
          { fields: ['uuid'], name: 'idx_job_applications_uuid' },
        ],
        comment: 'Job applications'
      }
    );
    return JobApplication;
  }
}
