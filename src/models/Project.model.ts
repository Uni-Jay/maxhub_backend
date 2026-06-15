import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ProjectAttributes {
  id: bigint;
  uuid: string;
  projectCode: string;
  name: string;
  description?: string;
  departmentId: bigint;
  clientId?: bigint;
  projectManagerId: bigint;
  startDate: Date;
  endDate?: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  budget?: number;
  status: 'Planning' | 'Active' | 'OnHold' | 'Completed' | 'Cancelled' | 'Archived';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  progress?: number;
  documentationUrl?: string;
  deletedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'uuid'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: bigint;
  public uuid!: string;
  public projectCode!: string;
  public name!: string;
  public description?: string;
  public departmentId!: bigint;
  public clientId?: bigint;
  public projectManagerId!: bigint;
  public startDate!: Date;
  public endDate?: Date;
  public expectedEndDate?: Date;
  public actualEndDate?: Date;
  public budget?: number;
  public status!: 'Planning' | 'Active' | 'OnHold' | 'Completed' | 'Cancelled' | 'Archived';
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public progress?: number;
  public documentationUrl?: string;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Project {
    Project.init(
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
        projectCode: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
          comment: 'Unique project code',
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Project name',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Project overview',
        },
        departmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to departments table',
        },
        clientId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to contacts/accounts table (if client project)',
        },
        projectManagerId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to staff table',
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Project start date',
        },
        endDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Project end date',
        },
        expectedEndDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Originally planned end date',
        },
        actualEndDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Actual completion date',
        },
        budget: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Project budget',
        },
        status: {
          type: DataTypes.ENUM('Planning', 'Active', 'OnHold', 'Completed', 'Cancelled', 'Archived'),
          defaultValue: 'Planning',
          allowNull: false,
          comment: 'Project status',
        },
        priority: {
          type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
          defaultValue: 'Medium',
          allowNull: false,
          comment: 'Project priority',
        },
        progress: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 0,
          validate: {
            min: 0,
            max: 100,
          },
          comment: 'Project progress percentage (0-100)',
        },
        documentationUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL to project documentation',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'projects',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['projectCode'],
            name: 'idx_projects_projectCode',
          },
          {
            fields: ['departmentId'],
            name: 'idx_projects_departmentId',
          },
          {
            fields: ['projectManagerId'],
            name: 'idx_projects_projectManagerId',
          },
          {
            fields: ['status'],
            name: 'idx_projects_status',
          },
          {
            fields: ['priority'],
            name: 'idx_projects_priority',
          },
          {
            fields: ['startDate'],
            name: 'idx_projects_startDate',
          },
          {
            fields: ['uuid'],
            name: 'idx_projects_uuid',
          },
        ],
        comment: 'Project management and tracking',
      }
    );

    return Project;
  }

  // Helper to check if project is delayed
  public isDelayed(): boolean {
    if (!this.expectedEndDate) return false;
    if (this.status === 'Completed' && this.actualEndDate) {
      return this.actualEndDate > this.expectedEndDate;
    }
    return new Date() > this.expectedEndDate && this.status !== 'Completed';
  }

  // Helper to get days remaining
  public getDaysRemaining(): number | null {
    if (!this.expectedEndDate) return null;
    const now = new Date();
    if (this.status === 'Completed' || this.status === 'Cancelled') return 0;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((this.expectedEndDate.getTime() - now.getTime()) / millisecondsPerDay);
  }
}