import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface PaymentAttributes {
  id: bigint;
  uuid: string;
  paymentCode: string;
  invoiceId?: bigint;
  accountId: bigint;
  paymentDate: Date;
  amount: number;
  currency: string;
  paymentMethod: 'Cash' | 'Cheque' | 'BankTransfer' | 'CreditCard' | 'Online' | 'Other';
  referenceNumber?: string;
  description?: string;
  status: 'Pending' | 'Processed' | 'Failed' | 'Cancelled';
  processedBy?: bigint;
  processedDate?: Date;
  deletedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'uuid'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes {
  public id!: bigint;
  public uuid!: string;
  public paymentCode!: string;
  public invoiceId?: bigint;
  public accountId!: bigint;
  public paymentDate!: Date;
  public amount!: number;
  public currency!: string;
  public paymentMethod!: 'Cash' | 'Cheque' | 'BankTransfer' | 'CreditCard' | 'Online' | 'Other';
  public referenceNumber?: string;
  public description?: string;
  public status!: 'Pending' | 'Processed' | 'Failed' | 'Cancelled';
  public processedBy?: bigint;
  public processedDate?: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Payment {
    Payment.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        paymentCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Payment code' },
        invoiceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Invoice ID' },
        accountId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Account ID' },
        paymentDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Payment date' },
        amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Payment amount' },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
        paymentMethod: { type: DataTypes.ENUM('Cash', 'Cheque', 'BankTransfer', 'CreditCard', 'Online', 'Other'), allowNull: false },
        referenceNumber: { type: DataTypes.STRING(100), allowNull: true, comment: 'Reference number' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        status: { type: DataTypes.ENUM('Pending', 'Processed', 'Failed', 'Cancelled'), defaultValue: 'Pending' },
        processedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Processed by user ID' },
        processedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Process date' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'payments', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['paymentCode'], name: 'idx_payments_paymentCode' },
          { fields: ['invoiceId'], name: 'idx_payments_invoiceId' },
          { fields: ['accountId'], name: 'idx_payments_accountId' },
          { fields: ['paymentMethod'], name: 'idx_payments_paymentMethod' },
          { fields: ['status'], name: 'idx_payments_status' },
          { fields: ['paymentDate'], name: 'idx_payments_paymentDate' },
          { fields: ['uuid'], name: 'idx_payments_uuid' },
        ],
        comment: 'Payments'
      }
    );
    return Payment;
  }
}
