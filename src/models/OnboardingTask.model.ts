import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface OnboardingTaskAttributes {
  id: bigint;
  uuid: string;
  jobOfferId: bigint;
  staffId?: bigint;
  taskName: string;
  description?: string;
  taskType: 'Document' | 'Training' | 'Equipment' | 'System' | 'Orientation' | 'Other';
  dueDate?: Date;
  assignedTo?: bigint;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Skipped';
  completedDate?: Date;
  notes?: string;
  deletedAt?: Date;
}

interface OnboardingTaskCreationAttributes extends Optional<OnboardingTaskAttributes, 'id' | 'uuid'> {}

export class OnboardingTask extends Model<OnboardingTaskAttributes, OnboardingTaskCreationAttributes>
  implements OnboardingTaskAttributes {
  public id!: bigint;
  public uuid!: string;
  public jobOfferId!: bigint;
  public staffId?: bigint;
  public taskName!: string;
  public description?: string;
  public taskType!: 'Document' | 'Training' | 'Equipment' | 'System' | 'Orientation' | 'Other';
  public dueDate?: Date;
  public assignedTo?: bigint;
  public status!: 'Pending' | 'InProgress' | 'Completed' | 'Skipped';
  public completedDate?: Date;
  public notes?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof OnboardingTask {
    OnboardingTask.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        jobOfferId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Job offer ID' },
        staffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Staff ID (once hired)' },
        taskName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Task name' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Task description' },
        taskType: { type: DataTypes.ENUM('Document', 'Training', 'Equipment', 'System', 'Orientation', 'Other'), allowNull: false },
        dueDate: { type: DataTypes.DATE, allowNull: true, comment: 'Task due date' },
        assignedTo: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Assigned to user ID' },
        status: { type: DataTypes.ENUM('Pending', 'InProgress', 'Completed', 'Skipped'), defaultValue: 'Pending' },
        completedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Completion date' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Notes' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'onboarding_tasks', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['jobOfferId'], name: 'idx_onboarding_tasks_jobOfferId' },
          { fields: ['staffId'], name: 'idx_onboarding_tasks_staffId' },
          { fields: ['assignedTo'], name: 'idx_onboarding_tasks_assignedTo' },
          { fields: ['status'], name: 'idx_onboarding_tasks_status' },
          { fields: ['dueDate'], name: 'idx_onboarding_tasks_dueDate' },
          { fields: ['uuid'], name: 'idx_onboarding_tasks_uuid' },
        ],
        comment: 'Onboarding tasks for new hires'
      }
    );
    return OnboardingTask;
  }
}
