import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface UnitAttributes {
  id: bigint;
  uuid: string;
  name: string;
  code: string;
  description?: string;
  branchId?: bigint;
  headUserId?: bigint;
  status: 'Active' | 'Inactive';
  deletedAt?: Date;
}

interface UnitCreationAttributes extends Optional<UnitAttributes, 'id' | 'uuid'> {}

export class Unit
  extends Model<UnitAttributes, UnitCreationAttributes>
  implements UnitAttributes
{
  public id!: bigint;
  public uuid!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public branchId?: bigint;
  public headUserId?: bigint;
  public status!: 'Active' | 'Inactive';
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Unit {
    Unit.init(
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
        name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Core unit name e.g. Finance Unit, IT Unit',
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: 'Short unit code e.g. FIN, IT, HR',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        branchId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to branches table',
        },
        headUserId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to users table — unit head',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive'),
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
        tableName: 'units',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          { fields: ['code', 'branchId'], name: 'idx_units_code_branchId' },
          { fields: ['branchId'], name: 'idx_units_branchId' },
          { fields: ['status'], name: 'idx_units_status' },
          { fields: ['uuid'], name: 'idx_units_uuid' },
        ],
        comment: 'Core organizational units within a branch',
      }
    );

    return Unit;
  }
}
