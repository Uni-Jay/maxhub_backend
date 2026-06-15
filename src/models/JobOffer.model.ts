import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface JobOfferAttributes {
  id: bigint;
  uuid: string;
  jobApplicationId: bigint;
  offerDate: Date;
  expectedJoiningDate: Date;
  offeredSalary: number;
  currency: string;
  offerDocument?: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Expired';
  acceptedDate?: Date;
  rejectedDate?: Date;
  notes?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface JobOfferCreationAttributes extends Optional<JobOfferAttributes, 'id' | 'uuid'> {}

export class JobOffer extends Model<JobOfferAttributes, JobOfferCreationAttributes>
  implements JobOfferAttributes {
  public id!: bigint;
  public uuid!: string;
  public jobApplicationId!: bigint;
  public offerDate!: Date;
  public expectedJoiningDate!: Date;
  public offeredSalary!: number;
  public currency!: string;
  public offerDocument?: string;
  public status!: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Expired';
  public acceptedDate?: Date;
  public rejectedDate?: Date;
  public notes?: string;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof JobOffer {
    JobOffer.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        jobApplicationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job application ID' },
        offerDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Offer date' },
        expectedJoiningDate: { type: DataTypes.DATE, allowNull: false, comment: 'Expected joining date' },
        offeredSalary: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Annual salary offered' },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
        offerDocument: { type: DataTypes.TEXT, allowNull: true, comment: 'Offer letter URL' },
        status: { type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected', 'Withdrawn', 'Expired'), defaultValue: 'Pending' },
        acceptedDate: { type: DataTypes.DATE, allowNull: true, comment: 'When accepted' },
        rejectedDate: { type: DataTypes.DATE, allowNull: true, comment: 'When rejected' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Internal notes' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'job_offers', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['jobApplicationId'], name: 'idx_job_offers_jobApplicationId' },
          { fields: ['status'], name: 'idx_job_offers_status' },
          { fields: ['createdById'], name: 'idx_job_offers_createdById' },
          { fields: ['expectedJoiningDate'], name: 'idx_job_offers_expectedJoiningDate' },
          { fields: ['uuid'], name: 'idx_job_offers_uuid' },
        ],
        comment: 'Job offers'
      }
    );
    return JobOffer;
  }
}
