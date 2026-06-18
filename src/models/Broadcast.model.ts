import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface BroadcastAttributes {
  id: bigint;
  uuid: string;
  title: string;
  message: string;
  audienceType: 'All' | 'BusinessUnit' | 'Department';
  audienceValue?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface BroadcastCreationAttributes extends Optional<BroadcastAttributes, 'id' | 'uuid'> {}

export class Broadcast
  extends Model<BroadcastAttributes, BroadcastCreationAttributes>
  implements BroadcastAttributes {
  declare id: bigint;
  declare uuid: string;
  declare title: string;
  declare message: string;
  declare audienceType: 'All' | 'BusinessUnit' | 'Department';
  declare audienceValue?: string;
  declare createdById: bigint;
  declare deletedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initModel(sequelize: Sequelize): typeof Broadcast {
    Broadcast.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        audienceType: { type: DataTypes.ENUM('All', 'BusinessUnit', 'Department'), defaultValue: 'All' },
        audienceValue: { type: DataTypes.STRING(255), allowNull: true },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        tableName: 'broadcasts',
        paranoid: true,
        timestamps: true,
        underscored: false,
        freezeTableName: true,
      }
    );
    return Broadcast;
  }
}

export default Broadcast;
