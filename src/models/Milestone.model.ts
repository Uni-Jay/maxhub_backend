import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface MilestoneAttributes {
  id: bigint;
  uuid: string;
  projectId: bigint;
  title: string;
  description?: string;
  startDate?: Date;
  targetDate: Date;
  completionDate?: Date;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Delayed';
  progress?: number;
  deletedAt?: Date;
}

interface MilestoneCreationAttributes extends Optional<MilestoneAttributes, 'id' | 'uuid'> {}

export class Milestone extends Model<MilestoneAttributes, MilestoneCreationAttributes>
  implements MilestoneAttributes {
  public id!: bigint;
  public uuid!: string;
  public projectId!: bigint;
  public title!: string;
  public description?: string;
  public startDate?: Date;
  public targetDate!: Date;
  public completionDate?: Date;
  public status!: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Delayed';
  public progress?: number;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Milestone {
    Milestone.init(
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
        projectId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to projects table',
        },
        title: {
          type: DataTypes.STRING(300),
          allowNull: false,
          comment: 'Milestone title',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Milestone details',
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Milestone start date',
        },
        targetDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Target completion date',
        },
        completionDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Actual completion date',
        },
        status: {
          type: DataTypes.ENUM('Pending', 'InProgress', 'Completed', 'Cancelled', 'Delayed'),
          defaultValue: 'Pending',
          allowNull: false,
          comment: 'Milestone status',
        },
        progress: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 0,
          validate: { min: 0, max: 100 },
          comment: 'Completion percentage',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'milestones',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          { fields: ['projectId'], name: 'idx_milestones_projectId' },
          { fields: ['status'], name: 'idx_milestones_status' },
          { fields: ['targetDate'], name: 'idx_milestones_targetDate' },
          { fields: ['uuid'], name: 'idx_milestones_uuid' },
        ],
        comment: 'Project milestones',
      }
    );
    return Milestone;
  }

  public isOverdue(): boolean {
    return new Date() > this.targetDate && this.status !== 'Completed' && this.status !== 'Cancelled';
  }

  public isCompleted(): boolean {
    return this.status === 'Completed';
  }
}
