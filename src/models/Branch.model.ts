import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface BranchAttributes {
  id: bigint;
  uuid: string;
  branchCode: string;
  branchName: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: bigint;
  status: 'Active' | 'Inactive' | 'Closed';
  deletedAt?: Date;
}

interface BranchCreationAttributes extends Optional<BranchAttributes, 'id' | 'uuid'> {}

export class Branch
  extends Model<BranchAttributes, BranchCreationAttributes>
  implements BranchAttributes
{
  public id!: bigint;
  public uuid!: string;
  public branchCode!: string;
  public branchName!: string;
  public country?: string;
  public state?: string;
  public city?: string;
  public address?: string;
  public phone?: string;
  public email?: string;
  public managerId?: bigint;
  public status!: 'Active' | 'Inactive' | 'Closed';
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Branch {
    Branch.init(
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
          allowNull: false,
          unique: true,
        },
        branchCode: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'Unique branch code e.g. HQ, LAG01, ABJ01',
        },
        branchName: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Full branch name',
        },
        country: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        state: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: { isEmail: true },
        },
        managerId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to users table — branch manager',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'Closed'),
          defaultValue: 'Active',
          allowNull: false,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'branches',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          { fields: ['branchCode'], name: 'idx_branches_branchCode' },
          { fields: ['status'], name: 'idx_branches_status' },
          { fields: ['managerId'], name: 'idx_branches_managerId' },
          { fields: ['uuid'], name: 'idx_branches_uuid' },
        ],
        comment: 'Company branch / office locations',
      }
    );

    return Branch;
  }
}
