import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface TrainingProgramAttributes {
  id: bigint;
  uuid: string;
  trainingCode: string;
  trainingName: string;
  description?: string;
  trainingType: 'Mandatory' | 'Optional' | 'InductionProgram' | 'SkillDevelopment' | 'Leadership';
  duration: number;
  durationUnit: 'Days' | 'Weeks' | 'Months' | 'Hours';
  provider?: string;
  location?: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
  startDate: Date;
  endDate: Date;
  budget?: number;
  createdById: bigint;
  deletedAt?: Date;
}

interface TrainingProgramCreationAttributes extends Optional<TrainingProgramAttributes, 'id' | 'uuid'> {}

export class TrainingProgram extends Model<TrainingProgramAttributes, TrainingProgramCreationAttributes>
  implements TrainingProgramAttributes {
  public id!: bigint;
  public uuid!: string;
  public trainingCode!: string;
  public trainingName!: string;
  public description?: string;
  public trainingType!: 'Mandatory' | 'Optional' | 'InductionProgram' | 'SkillDevelopment' | 'Leadership';
  public duration!: number;
  public durationUnit!: 'Days' | 'Weeks' | 'Months' | 'Hours';
  public provider?: string;
  public location?: string;
  public status!: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
  public startDate!: Date;
  public endDate!: Date;
  public budget?: number;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof TrainingProgram {
    TrainingProgram.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        trainingCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Training code' },
        trainingName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Training name' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        trainingType: { type: DataTypes.ENUM('Mandatory', 'Optional', 'InductionProgram', 'SkillDevelopment', 'Leadership'), allowNull: false },
        duration: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Duration' },
        durationUnit: { type: DataTypes.ENUM('Days', 'Weeks', 'Months', 'Hours'), allowNull: false },
        provider: { type: DataTypes.STRING(200), allowNull: true, comment: 'Training provider' },
        location: { type: DataTypes.STRING(200), allowNull: true, comment: 'Location' },
        status: { type: DataTypes.ENUM('Draft', 'Active', 'Completed', 'Cancelled'), defaultValue: 'Draft' },
        startDate: { type: DataTypes.DATE, allowNull: false, comment: 'Start date' },
        endDate: { type: DataTypes.DATE, allowNull: false, comment: 'End date' },
        budget: { type: DataTypes.DECIMAL(12, 2), allowNull: true, comment: 'Budget' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'training_programs', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['trainingCode'], name: 'idx_training_programs_trainingCode' },
          { fields: ['trainingType'], name: 'idx_training_programs_trainingType' },
          { fields: ['status'], name: 'idx_training_programs_status' },
          { fields: ['startDate'], name: 'idx_training_programs_startDate' },
          { fields: ['uuid'], name: 'idx_training_programs_uuid' },
        ],
        comment: 'Training programs'
      }
    );
    return TrainingProgram;
  }
}
