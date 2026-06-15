import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface LeaveRequestAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  leaveTypeId: bigint;
  startDate: Date;
  endDate: Date;
  numberofDays: number;
  reason: string;
  documentUrl?: string;
  approverUserId?: bigint;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Withdrawn';
  approvalComments?: string;
  approvalDate?: Date;
  cancelledBy?: bigint;
  cancellationReason?: string;
  cancellationDate?: Date;
  deletedAt?: Date;
}

interface LeaveRequestCreationAttributes extends Optional<LeaveRequestAttributes, 'id' | 'uuid'> {}

export class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes>
  implements LeaveRequestAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public leaveTypeId!: bigint;
  public startDate!: Date;
  public endDate!: Date;
  public numberofDays!: number;
  public reason!: string;
  public documentUrl?: string;
  public approverUserId?: bigint;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Withdrawn';
  public approvalComments?: string;
  public approvalDate?: Date;
  public cancelledBy?: bigint;
  public cancellationReason?: string;
  public cancellationDate?: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof LeaveRequest {
    LeaveRequest.init(
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
        leaveTypeId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to leave_types table',
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Leave start date',
        },
        endDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Leave end date',
        },
        numberofDays: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Number of days requested',
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'Reason for leave request',
        },
        documentUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL to supporting document (medical cert, etc.)',
        },
        approverUserId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Manager/approver user ID',
        },
        status: {
          type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'Withdrawn'),
          defaultValue: 'Pending',
          allowNull: false,
          comment: 'Leave request status',
        },
        approvalComments: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Approver comments',
        },
        approvalDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When approval/rejection was made',
        },
        cancelledBy: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'User who cancelled the leave',
        },
        cancellationReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Reason for cancellation',
        },
        cancellationDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When leave was cancelled',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'leave_requests',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['staffId'],
            name: 'idx_leave_requests_staffId',
          },
          {
            fields: ['leaveTypeId'],
            name: 'idx_leave_requests_leaveTypeId',
          },
          {
            fields: ['status'],
            name: 'idx_leave_requests_status',
          },
          {
            fields: ['approverUserId'],
            name: 'idx_leave_requests_approverUserId',
          },
          {
            fields: ['startDate', 'endDate'],
            name: 'idx_leave_requests_startDate_endDate',
          },
          {
            fields: ['createdAt'],
            name: 'idx_leave_requests_createdAt',
          },
          {
            fields: ['uuid'],
            name: 'idx_leave_requests_uuid',
          },
        ],
        comment: 'Leave requests from employees',
      }
    );

    return LeaveRequest;
  }

  // Helper to check if leave request can be cancelled
  public canBeCancelled(): boolean {
    return this.status === 'Pending' || this.status === 'Approved';
  }

  // Helper to check if leave request can be withdrawn
  public canBeWithdrawn(): boolean {
    return this.status === 'Pending';
  }

  // Helper to calculate days between dates
  public calculateDays(): number {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
  }

  // Helper to check if dates are in past
  public isInPast(): boolean {
    return new Date(this.endDate) < new Date();
  }
}