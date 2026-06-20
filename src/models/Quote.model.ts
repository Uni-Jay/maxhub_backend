import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface QuoteLineItem {
  description: string;
  qty: number;
  unitPrice: number;
}

interface QuoteAttributes {
  id: bigint;
  uuid: string;
  quoteCode: string;
  opportunityId?: bigint;
  accountId?: bigint;
  contactId?: bigint;
  clientId?: bigint;
  departmentId?: bigint;
  title?: string;
  scopeOfWork?: string;
  termsAndConditions?: string;
  items?: QuoteLineItem[];
  quoteDate: Date;
  validUntil: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  description?: string;
  sentAt?: Date;
  respondedAt?: Date;
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
  public clientId?: bigint;
  public departmentId?: bigint;
  public title?: string;
  public scopeOfWork?: string;
  public termsAndConditions?: string;
  public items?: QuoteLineItem[];
  public quoteDate!: Date;
  public validUntil!: Date;
  public subtotal!: number;
  public discount!: number;
  public tax!: number;
  public total!: number;
  public currency!: string;
  public status!: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  public description?: string;
  public sentAt?: Date;
  public respondedAt?: Date;
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
        clientId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Client ID (CRM customer this proposal is for)' },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Department/business unit, denormalized from client at creation for fast scoping' },
        title: { type: DataTypes.STRING(200), allowNull: true, comment: 'Proposal title' },
        scopeOfWork: { type: DataTypes.TEXT, allowNull: true, comment: 'What we will deliver' },
        termsAndConditions: { type: DataTypes.TEXT, allowNull: true, comment: 'Our terms and conditions for this engagement' },
        items: { type: DataTypes.JSONB, allowNull: true, comment: 'Line items: [{description, qty, unitPrice}]' },
        quoteDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Quote date' },
        validUntil: { type: DataTypes.DATE, allowNull: false, comment: 'Valid until date' },
        subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
        discount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
        tax: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
        total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total' },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
        status: { type: DataTypes.ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'), defaultValue: 'Draft' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        sentAt: { type: DataTypes.DATE, allowNull: true, comment: 'When this was emailed to the client' },
        respondedAt: { type: DataTypes.DATE, allowNull: true, comment: 'When the client accepted/rejected' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'quotes', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['quoteCode'], name: 'idx_quotes_quoteCode' },
          { fields: ['opportunityId'], name: 'idx_quotes_opportunityId' },
          { fields: ['accountId'], name: 'idx_quotes_accountId' },
          { fields: ['clientId'], name: 'idx_quotes_clientId' },
          { fields: ['departmentId'], name: 'idx_quotes_departmentId' },
          { fields: ['status'], name: 'idx_quotes_status' },
          { fields: ['validUntil'], name: 'idx_quotes_validUntil' },
          { fields: ['createdById'], name: 'idx_quotes_createdById' },
          { fields: ['uuid'], name: 'idx_quotes_uuid' },
        ],
        comment: 'Sales quotes / client proposals'
      }
    );
    return Quote;
  }
}
