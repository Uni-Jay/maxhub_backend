import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface StaffQueryAttributes {
  id: bigint;
  uuid: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  type: 'Query' | 'Complaint' | 'Task' | 'Issue' | 'Request';
  departmentId?: bigint;
  assignedStaffId?: bigint;
  createdByUserId: bigint;
  status: 'Pending' | 'InProgress' | 'Resolved' | 'Closed';
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  attachments?: string; // JSON array of file URLs
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface StaffQueryCreationAttributes
  extends Optional<
    StaffQueryAttributes,
    | 'id'
    | 'uuid'
    | 'departmentId'
    | 'assignedStaffId'
    | 'dueDate'
    | 'resolvedAt'
    | 'closedAt'
    | 'attachments'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class StaffQuery
  extends Model<StaffQueryAttributes, StaffQueryCreationAttributes>
  implements StaffQueryAttributes
{
  declare id: bigint;
  declare uuid: string;
  declare title: string;
  declare description: string;
  declare priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  declare type: 'Query' | 'Complaint' | 'Task' | 'Issue' | 'Request';
  declare departmentId?: bigint;
  declare assignedStaffId?: bigint;
  declare createdByUserId: bigint;
  declare status: 'Pending' | 'InProgress' | 'Resolved' | 'Closed';
  declare dueDate?: Date;
  declare resolvedAt?: Date;
  declare closedAt?: Date;
  declare attachments?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;

  static initModel(sequelize: Sequelize): void {
    StaffQuery.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        priority: {
          type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
          defaultValue: 'Medium',
        },
        type: {
          type: DataTypes.ENUM('Query', 'Complaint', 'Task', 'Issue', 'Request'),
          defaultValue: 'Query',
        },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        assignedStaffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        createdByUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        status: {
          type: DataTypes.ENUM('Pending', 'InProgress', 'Resolved', 'Closed'),
          defaultValue: 'Pending',
        },
        dueDate: { type: DataTypes.DATE, allowNull: true },
        resolvedAt: { type: DataTypes.DATE, allowNull: true },
        closedAt: { type: DataTypes.DATE, allowNull: true },
        attachments: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        modelName: 'StaffQuery',
        tableName: 'staff_queries',
        paranoid: true,
        timestamps: true,
      }
    );
  }
}

export default StaffQuery;
