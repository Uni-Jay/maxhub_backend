import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface TimesheetAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  projectId?: bigint;
  taskId?: bigint;
  timesheetDate: Date;
  hoursWorked: number;
  description: string;
  category: 'Development' | 'Testing' | 'Design' | 'Management' | 'Support' | 'Other';
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  submittedAt?: Date;
  approvedBy?: bigint;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
  deletedAt?: Date;
}

interface TimesheetCreationAttributes extends Optional<TimesheetAttributes, 'id' | 'uuid'> {}

export class Timesheet extends Model<TimesheetAttributes, TimesheetCreationAttributes>
  implements TimesheetAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public projectId?: bigint;
  public taskId?: bigint;
  public timesheetDate!: Date;
  public hoursWorked!: number;
  public description!: string;
  public category!: 'Development' | 'Testing' | 'Design' | 'Management' | 'Support' | 'Other';
  public status!: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  public submittedAt?: Date;
  public approvedBy?: bigint;
  public approvalStatus!: 'Pending' | 'Approved' | 'Rejected';
  public remarks?: string;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Timesheet {
    Timesheet.init(
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
        staffId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to staff table',
        },
        projectId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to projects table',
        },
        taskId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to tasks table',
        },
        timesheetDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Date for which timesheet entry is created',
        },
        hoursWorked: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          validate: {
            min: 0,
            max: 24,
          },
          comment: 'Number of hours worked',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'Work description/activities',
        },
        category: {
          type: DataTypes.ENUM('Development', 'Testing', 'Design', 'Management', 'Support', 'Other'),
          defaultValue: 'Development',
          allowNull: false,
          comment: 'Work category',
        },
        status: {
          type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
          defaultValue: 'Draft',
          allowNull: false,
          comment: 'Timesheet status',
        },
        submittedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When timesheet was submitted',
        },
        approvedBy: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Manager who approved the timesheet',
        },
        approvalStatus: {
          type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
          defaultValue: 'Pending',
          allowNull: false,
          comment: 'Manager approval status',
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Approval remarks',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'timesheets',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['staffId'],
            name: 'idx_timesheets_staffId',
          },
          {
            fields: ['projectId'],
            name: 'idx_timesheets_projectId',
          },
          {
            fields: ['taskId'],
            name: 'idx_timesheets_taskId',
          },
          {
            fields: ['timesheetDate'],
            name: 'idx_timesheets_timesheetDate',
          },
          {
            fields: ['status'],
            name: 'idx_timesheets_status',
          },
          {
            fields: ['approvalStatus'],
            name: 'idx_timesheets_approvalStatus',
          },
          {
            fields: ['staffId', 'timesheetDate'],
            name: 'idx_timesheets_staffId_timesheetDate',
          },
          {
            fields: ['uuid'],
            name: 'idx_timesheets_uuid',
          },
        ],
        comment: 'Employee timesheets for project tracking',
      }
    );

    return Timesheet;
  }
}