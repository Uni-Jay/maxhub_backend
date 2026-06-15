import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface QuoteAttributes {
  id: bigint;
  uuid: string;
  quoteCode: string;
  opportunityId?: bigint;
  accountId?: bigint;
  contactId?: bigint;
  quoteDate: Date;
  validUntil: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  description?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface QuoteCreationAttributes extends Optional<QuoteAttributes, 'id' | 'uuid'> {}

export class Quote extends Model<QuoteAttributes, QuoteCreationAttributes>
  implements QuoteAttributes {
  public id!: bigint;
  public uuid!: string;
  public quoteCode!: string;
  public opportunityId?: bigint;
  public accountId?: bigint;
  public contactId?: bigint;
  public quoteDate!: Date;
  public validUntil!: Date;
  public subtotal!: number;
  public discount!: number;
  public tax!: number;
  public total!: number;
  public currency!: string;
  public status!: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  public description?: string;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Quote {
    Quote.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        quoteCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Quote code' },
        opportunityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Opportunity ID' },
        accountId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Account ID' },
        contactId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Contact ID' },
        quoteDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Quote date' },
        validUntil: { type: DataTypes.DATE, allowNull: false, comment: 'Valid until date' },
        subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
        discount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
        tax: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
        total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total' },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
        status: { type: DataTypes.ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'), defaultValue: 'Draft' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'quotes', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['quoteCode'], name: 'idx_quotes_quoteCode' },
          { fields: ['opportunityId'], name: 'idx_quotes_opportunityId' },
          { fields: ['accountId'], name: 'idx_quotes_accountId' },
          { fields: ['status'], name: 'idx_quotes_status' },
          { fields: ['validUntil'], name: 'idx_quotes_validUntil' },
          { fields: ['createdById'], name: 'idx_quotes_createdById' },
          { fields: ['uuid'], name: 'idx_quotes_uuid' },
        ],
        comment: 'Sales quotes'
      }
    );
    return Quote;
  }
}
