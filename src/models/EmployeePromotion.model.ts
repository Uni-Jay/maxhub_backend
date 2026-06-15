import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface EmployeePromotionAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  fromDesignationId: bigint;
  toDesignationId: bigint;
  fromDepartmentId?: bigint;
  toDepartmentId?: bigint;
  promotionDate: Date;
  effectiveDate: Date;
  reason?: string;
  promotedBy: bigint;
  salaryIncreasePercentage?: number;
  newSalary?: number;
  status: 'Proposed' | 'Approved' | 'Rejected' | 'Effective' | 'Completed';
  approvalDate?: Date;
  approvalRemarks?: string;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface EmployeePromotionCreationAttributes extends Optional<EmployeePromotionAttributes, 'id' | 'uuid'> {}

export class EmployeePromotion
  extends Model<EmployeePromotionAttributes, EmployeePromotionCreationAttributes>
  implements EmployeePromotionAttributes
{
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public fromDesignationId!: bigint;
  public toDesignationId!: bigint;
  public fromDepartmentId?: bigint;
  public toDepartmentId?: bigint;
  public promotionDate!: Date;
  public effectiveDate!: Date;
  public reason?: string;
  public promotedBy!: bigint;
  public salaryIncreasePercentage?: number;
  public newSalary?: number;
  public status!: 'Proposed' | 'Approved' | 'Rejected' | 'Effective' | 'Completed';
  public approvalDate?: Date;
  public approvalRemarks?: string;
  public rejectionReason?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof EmployeePromotion {
    EmployeePromotion.init(
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
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        fromDesignationId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'designation',
            key: 'id',
          },
        },
        toDesignationId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'designation',
            key: 'id',
          },
        },
        fromDepartmentId: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'department',
            key: 'id',
          },
        },
        toDepartmentId: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'department',
            key: 'id',
          },
        },
        promotionDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        effectiveDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        promotedBy: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        salaryIncreasePercentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },
        newSalary: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('Proposed', 'Approved', 'Rejected', 'Effective', 'Completed'),
          allowNull: false,
          defaultValue: 'Proposed',
        },
        approvalDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        approvalRemarks: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        rejectionReason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'employee_promotion',
        tableName: 'employee_promotion',
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
            fields: ['effectiveDate'],
          },
        ],
      }
    );
    return EmployeePromotion;
  }
}
