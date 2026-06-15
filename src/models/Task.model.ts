import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface TaskAttributes {
  id: bigint;
  uuid: string;
  projectId: bigint;
  taskCode: string;
  title: string;
  description?: string;
  assigneeId?: bigint;
  reporterId: bigint;
  parentTaskId?: bigint;
  milestoneId?: bigint;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Todo' | 'InProgress' | 'InReview' | 'Blocked' | 'Done' | 'Cancelled';
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  label?: string;
  deletedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'uuid'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: bigint;
  public uuid!: string;
  public projectId!: bigint;
  public taskCode!: string;
  public title!: string;
  public description?: string;
  public assigneeId?: bigint;
  public reporterId!: bigint;
  public parentTaskId?: bigint;
  public milestoneId?: bigint;
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public status!: 'Todo' | 'InProgress' | 'InReview' | 'Blocked' | 'Done' | 'Cancelled';
  public startDate?: Date;
  public dueDate?: Date;
  public estimatedHours?: number;
  public actualHours?: number;
  public progress?: number;
  public label?: string;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Task {
    Task.init(
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
        taskCode: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
          comment: 'Unique task identifier',
        },
        title: {
          type: DataTypes.STRING(300),
          allowNull: false,
          comment: 'Task title',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Detailed task description',
        },
        assigneeId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Assigned staff member',
        },
        reporterId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Staff who created the task',
        },
        parentTaskId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Parent task for subtask hierarchy',
        },
        milestoneId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to milestones table',
        },
        priority: {
          type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
          defaultValue: 'Medium',
          allowNull: false,
          comment: 'Task priority',
        },
        status: {
          type: DataTypes.ENUM('Todo', 'InProgress', 'InReview', 'Blocked', 'Done', 'Cancelled'),
          defaultValue: 'Todo',
          allowNull: false,
          comment: 'Task status',
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Task start date',
        },
        dueDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Task due date',
        },
        estimatedHours: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Estimated hours for completion',
        },
        actualHours: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Actual hours spent',
        },
        progress: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 0,
          validate: {
            min: 0,
            max: 100,
          },
          comment: 'Task progress percentage (0-100)',
        },
        label: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Task labels/tags',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'tasks',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['projectId'],
            name: 'idx_tasks_projectId',
          },
          {
            fields: ['taskCode'],
            name: 'idx_tasks_taskCode',
          },
          {
            fields: ['assigneeId'],
            name: 'idx_tasks_assigneeId',
          },
          {
            fields: ['status'],
            name: 'idx_tasks_status',
          },
          {
            fields: ['priority'],
            name: 'idx_tasks_priority',
          },
          {
            fields: ['dueDate'],
            name: 'idx_tasks_dueDate',
          },
          {
            fields: ['parentTaskId'],
            name: 'idx_tasks_parentTaskId',
          },
          {
            fields: ['uuid'],
            name: 'idx_tasks_uuid',
          },
        ],
        comment: 'Project tasks with dependencies and tracking',
      }
    );

    return Task;
  }

  // Helper to check if task is overdue
  public isOverdue(): boolean {
    if (!this.dueDate || this.status === 'Done' || this.status === 'Cancelled') return false;
    return new Date() > this.dueDate;
  }

  // Helper to check if task is blocked
  public isBlocked(): boolean {
    return this.status === 'Blocked';
  }

  // Helper to get burndown percentage
  public getBurndownPercent(): number {
    if (this.status === 'Done') return 100;
    if (this.status === 'Cancelled') return 0;
    return this.progress || 0;
  }

  // Helper to calculate efficiency
  public getEfficiency(): number | null {
    if (!this.estimatedHours || !this.actualHours) return null;
    return (Number(this.estimatedHours) / Number(this.actualHours)) * 100;
  }
}