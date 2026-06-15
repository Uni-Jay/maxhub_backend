import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ResignationAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  resignationDate: Date;
  lastWorkingDate?: Date;
  reasonForResignation: string;
  noticePeroidDays: number;
  status: 'Submitted' | 'Acknowledged' | 'Approved' | 'Rejected' | 'Completed';
  acknowledgmentDate?: Date;
  approvalDate?: Date;
  approvedBy?: bigint;
  rejectionReason?: string;
  exitInterviewDate?: Date;
  finalSettlementDate?: Date;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface ResignationCreationAttributes extends Optional<ResignationAttributes, 'id' | 'uuid'> {}

export class Resignation
  extends Model<ResignationAttributes, ResignationCreationAttributes>
  implements ResignationAttributes
{
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public resignationDate!: Date;
  public lastWorkingDate?: Date;
  public reasonForResignation!: string;
  public noticePeroidDays!: number;
  public status!: 'Submitted' | 'Acknowledged' | 'Approved' | 'Rejected' | 'Completed';
  public acknowledgmentDate?: Date;
  public approvalDate?: Date;
  public approvedBy?: bigint;
  public rejectionReason?: string;
  public exitInterviewDate?: Date;
  public finalSettlementDate?: Date;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof Resignation {
    Resignation.init(
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
        staffId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          unique: true,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        resignationDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        lastWorkingDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        reasonForResignation: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        noticePeroidDays: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 30,
        },
        status: {
          type: DataTypes.ENUM('Submitted', 'Acknowledged', 'Approved', 'Rejected', 'Completed'),
          allowNull: false,
          defaultValue: 'Submitted',
        },
        acknowledgmentDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        approvalDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        approvedBy: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        rejectionReason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        exitInterviewDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        finalSettlementDate: {
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
        modelName: 'resignation',
        tableName: 'resignation',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['staffId'],
          },
          {
            fields: ['status'],
          },
          {
            fields: ['resignationDate'],
          },
        ],
      }
    );
    return Resignation;
  }
}
