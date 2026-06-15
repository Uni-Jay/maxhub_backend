import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface LeaveBalanceAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  leaveTypeId: bigint;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  balanceDays: number;
  carryForwardDays?: number;
  lastUpdated: Date;
  deletedAt?: Date;
}

interface LeaveBalanceCreationAttributes extends Optional<LeaveBalanceAttributes, 'id' | 'uuid'> {}

export class LeaveBalance extends Model<LeaveBalanceAttributes, LeaveBalanceCreationAttributes>
  implements LeaveBalanceAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public leaveTypeId!: bigint;
  public year!: number;
  public totalDays!: number;
  public usedDays!: number;
  public pendingDays!: number;
  public balanceDays!: number;
  public carryForwardDays?: number;
  public lastUpdated!: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof LeaveBalance {
    LeaveBalance.init(
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
        year: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          comment: 'Leave year',
        },
        totalDays: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Total leave days allocated',
        },
        usedDays: {
          type: DataTypes.DECIMAL(5, 2),
          defaultValue: 0,
          allowNull: false,
          comment: 'Days already used',
        },
        pendingDays: {
          type: DataTypes.DECIMAL(5, 2),
          defaultValue: 0,
          allowNull: false,
          comment: 'Days in pending approval',
        },
        balanceDays: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Available days (totalDays - usedDays - pendingDays)',
        },
        carryForwardDays: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Carryover from previous year',
        },
        lastUpdated: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Last balance update timestamp',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'leave_balances',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['staffId'],
            name: 'idx_leave_balances_staffId',
          },
          {
            fields: ['leaveTypeId'],
            name: 'idx_leave_balances_leaveTypeId',
          },
          {
            fields: ['year'],
            name: 'idx_leave_balances_year',
          },
          {
            fields: ['staffId', 'leaveTypeId', 'year'],
            unique: true,
            name: 'idx_leave_balances_staffId_leaveTypeId_year_unique',
          },
          {
            fields: ['uuid'],
            name: 'idx_leave_balances_uuid',
          },
        ],
        comment: 'Employee leave balance tracking',
      }
    );

    return LeaveBalance;
  }

  // Helper to check available balance
  public getAvailableBalance(): number {
    return Number(this.balanceDays);
  }

  // Helper to update balance
  public updateBalance(approvedDays: number, pendingDays: number = 0) {
    this.usedDays = Number(this.usedDays) + approvedDays;
    this.pendingDays = Number(this.pendingDays) + pendingDays;
    this.balanceDays = Number(this.totalDays) - Number(this.usedDays) - Number(this.pendingDays);
    this.lastUpdated = new Date();
  }
}