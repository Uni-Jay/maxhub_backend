import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface TaskAssignmentAttributes {
  id: bigint;
  uuid: string;
  taskId: bigint;
  projectId: bigint;
  assignedToStaffId: bigint;
  assignedByStaffId: bigint;
  assignedDate: Date;
  estimatedHours?: number;
  actualHours?: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignmentStatus: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  acceptedDate?: Date;
  declinedDate?: Date;
  declinedReason?: string;
  completedDate?: Date;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface TaskAssignmentCreationAttributes extends Optional<TaskAssignmentAttributes, 'id' | 'uuid'> {}

export class TaskAssignment
  extends Model<TaskAssignmentAttributes, TaskAssignmentCreationAttributes>
  implements TaskAssignmentAttributes
{
  public id!: bigint;
  public uuid!: string;
  public taskId!: bigint;
  public projectId!: bigint;
  public assignedToStaffId!: bigint;
  public assignedByStaffId!: bigint;
  public assignedDate!: Date;
  public estimatedHours?: number;
  public actualHours?: number;
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public assignmentStatus!: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  public acceptedDate?: Date;
  public declinedDate?: Date;
  public declinedReason?: string;
  public completedDate?: Date;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof TaskAssignment {
    TaskAssignment.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: uuidv4,
        },
        taskId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'task',
            key: 'id',
          },
        },
        projectId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'project',
            key: 'id',
          },
        },
        assignedToStaffId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        assignedByStaffId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        assignedDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        estimatedHours: {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: true,
        },
        actualHours: {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: true,
        },
        priority: {
          type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
          allowNull: false,
          defaultValue: 'Medium',
        },
        assignmentStatus: {
          type: DataTypes.ENUM('Pending', 'Accepted', 'Declined', 'Completed'),
          allowNull: false,
          defaultValue: 'Pending',
        },
        acceptedDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        declinedDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        declinedReason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        completedDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'task_assignment',
        tableName: 'task_assignment',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['taskId'],
          },
          {
            fields: ['projectId'],
          },
          {
            fields: ['assignedToStaffId'],
          },
          {
            fields: ['assignmentStatus'],
          },
        ],
      }
    );
    return TaskAssignment;
  }
}
