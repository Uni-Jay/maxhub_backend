import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface MessageTemplateAttributes {
  id: bigint;
  uuid: string;
  name: string;
  type: 'Weekly' | 'Birthday' | 'Custom' | 'Welcome' | 'Reminder';
  subject?: string;
  emailContent?: string;
  smsContent?: string;
  whatsappContent?: string;
  isActive: boolean;
  createdByUserId: bigint;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface MessageTemplateCreationAttributes
  extends Optional<
    MessageTemplateAttributes,
    | 'id'
    | 'uuid'
    | 'subject'
    | 'emailContent'
    | 'smsContent'
    | 'whatsappContent'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class MessageTemplate
  extends Model<MessageTemplateAttributes, MessageTemplateCreationAttributes>
  implements MessageTemplateAttributes
{
  declare id: bigint;
  declare uuid: string;
  declare name: string;
  declare type: 'Weekly' | 'Birthday' | 'Custom' | 'Welcome' | 'Reminder';
  declare subject?: string;
  declare emailContent?: string;
  declare smsContent?: string;
  declare whatsappContent?: string;
  declare isActive: boolean;
  declare createdByUserId: bigint;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;

  static initModel(sequelize: Sequelize): void {
    MessageTemplate.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        type: {
          type: DataTypes.ENUM('Weekly', 'Birthday', 'Custom', 'Welcome', 'Reminder'),
          defaultValue: 'Custom',
        },
        subject: { type: DataTypes.STRING(500), allowNull: true },
        emailContent: { type: DataTypes.TEXT, allowNull: true },
        smsContent: { type: DataTypes.TEXT, allowNull: true },
        whatsappContent: { type: DataTypes.TEXT, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        createdByUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      },
      {
        sequelize,
        modelName: 'MessageTemplate',
        tableName: 'message_templates',
        paranoid: true,
        timestamps: true,
      }
    );
  }
}

export default MessageTemplate;
