import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface ClientNoteAttributes {
  id: bigint;
  uuid: string;
  clientId: bigint;
  note: string;
  createdByUserId: bigint;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface ClientNoteCreationAttributes
  extends Optional<
    ClientNoteAttributes,
    'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

export class ClientNote
  extends Model<ClientNoteAttributes, ClientNoteCreationAttributes>
  implements ClientNoteAttributes
{
  declare id: bigint;
  declare uuid: string;
  declare clientId: bigint;
  declare note: string;
  declare createdByUserId: bigint;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;

  static initModel(sequelize: Sequelize): void {
    ClientNote.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        clientId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        note: { type: DataTypes.TEXT, allowNull: false },
        createdByUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      },
      {
        sequelize,
        modelName: 'ClientNote',
        tableName: 'client_notes',
        paranoid: true,
        timestamps: true,
      }
    );
  }
}

export default ClientNote;
