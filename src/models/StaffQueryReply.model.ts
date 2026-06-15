import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface StaffQueryReplyAttributes {
  id: bigint;
  uuid: string;
  queryId: bigint;
  message: string;
  senderUserId: bigint;
  isInternal: boolean; // internal note vs public reply
  attachments?: string; // JSON array of file URLs
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface StaffQueryReplyCreationAttributes
  extends Optional<
    StaffQueryReplyAttributes,
    'id' | 'uuid' | 'isInternal' | 'attachments' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

export class StaffQueryReply
  extends Model<StaffQueryReplyAttributes, StaffQueryReplyCreationAttributes>
  implements StaffQueryReplyAttributes
{
  declare id: bigint;
  declare uuid: string;
  declare queryId: bigint;
  declare message: string;
  declare senderUserId: bigint;
  declare isInternal: boolean;
  declare attachments?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;

  static initModel(sequelize: Sequelize): void {
    StaffQueryReply.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        queryId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        senderUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        isInternal: { type: DataTypes.BOOLEAN, defaultValue: false },
        attachments: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        modelName: 'StaffQueryReply',
        tableName: 'staff_query_replies',
        paranoid: true,
        timestamps: true,
      }
    );
  }
}

export default StaffQueryReply;
