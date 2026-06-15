import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface InvoiceAttributes {
  id: bigint;
  uuid: string;
  invoiceCode: string;
  orderId?: bigint;
  accountId: bigint;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'Draft' | 'Issued' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Cancelled';
  description?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'uuid'> {}

export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes>
  implements InvoiceAttributes {
  public id!: bigint;
  public uuid!: string;
  public invoiceCode!: string;
  public orderId?: bigint;
  public accountId!: bigint;
  public invoiceDate!: Date;
  public dueDate!: Date;
  public subtotal!: number;
  public discount!: number;
  public tax!: number;
  public total!: number;
  public currency!: string;
  public status!: 'Draft' | 'Issued' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Cancelled';
  public description?: string;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Invoice {
    Invoice.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        invoiceCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Invoice code' },
        orderId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Order ID' },
        accountId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Account ID' },
        invoiceDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Invoice date' },
        dueDate: { type: DataTypes.DATE, allowNull: false, comment: 'Due date' },
        subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
        discount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
        tax: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
        total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total' },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
        status: { type: DataTypes.ENUM('Draft', 'Issued', 'PartiallyPaid', 'Paid', 'Overdue', 'Cancelled'), defaultValue: 'Draft' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'invoices', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['invoiceCode'], name: 'idx_invoices_invoiceCode' },
          { fields: ['orderId'], name: 'idx_invoices_orderId' },
          { fields: ['accountId'], name: 'idx_invoices_accountId' },
          { fields: ['status'], name: 'idx_invoices_status' },
          { fields: ['dueDate'], name: 'idx_invoices_dueDate' },
          { fields: ['createdById'], name: 'idx_invoices_createdById' },
          { fields: ['uuid'], name: 'idx_invoices_uuid' },
        ],
        comment: 'Invoices'
      }
    );
    return Invoice;
  }
}
