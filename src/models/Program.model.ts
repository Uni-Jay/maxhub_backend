import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type ProgramLevel = 'Certificate' | 'Diploma' | 'Professional' | 'Short Course';
export type ProgramStatus = 'Active' | 'Inactive' | 'Draft';

interface ProgramAttributes {
  id: bigint;
  uuid: string;
  companyId: bigint;
  name: string;
  code: string;
  description?: string;
  level: ProgramLevel;
  durationMonths: number;
  maxStudents?: number;
  tuitionFee?: number;
  currency: string;
  prerequisites?: string;
  outcomes?: string;
  thumbnail?: string;
  status: ProgramStatus;
  createdById?: bigint;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProgramCreationAttributes
  extends Optional<ProgramAttributes, 'id' | 'uuid' | 'status' | 'currency'> {}

export class Program
  extends Model<ProgramAttributes, ProgramCreationAttributes>
  implements ProgramAttributes
{
  public id!: bigint;
  public uuid!: string;
  public companyId!: bigint;
  public name!: string;
  public code!: string;
  public description?: string;
  public level!: ProgramLevel;
  public durationMonths!: number;
  public maxStudents?: number;
  public tuitionFee?: number;
  public currency!: string;
  public prerequisites?: string;
  public outcomes?: string;
  public thumbnail?: string;
  public status!: ProgramStatus;
  public createdById?: bigint;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Program {
    Program.init(
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
        companyId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        level: {
          type: DataTypes.ENUM('Certificate', 'Diploma', 'Professional', 'Short Course'),
          allowNull: false,
        },
        durationMonths: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 3 },
        maxStudents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        tuitionFee: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'NGN' },
        prerequisites: { type: DataTypes.TEXT, allowNull: true },
        outcomes: { type: DataTypes.TEXT, allowNull: true },
        thumbnail: { type: DataTypes.STRING(500), allowNull: true },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'Draft'),
          allowNull: false,
          defaultValue: 'Draft',
        },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      },
      {
        sequelize,
        modelName: 'Program',
        tableName: 'programs',
        timestamps: true,
        underscored: false,
        paranoid: false,
        indexes: [{ fields: ['companyId'] }, { fields: ['status'] }],
      }
    );
    return Program;
  }
}

export default Program;
