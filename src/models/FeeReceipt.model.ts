import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface FeeReceiptAttributes {
  id: bigint;
  uuid: string;
  enrollmentId: bigint;
  receiptNumber: string;
  amountPaid: number;
  paymentMethod: 'Cash' | 'BankTransfer' | 'POS' | 'Online';
  paymentDate: Date;
  session: string;
  balance: number;
  status: 'Paid' | 'PartPayment' | 'Pending';
  notes?: string;
  issuedById: bigint;
  deletedAt?: Date;
}

interface FeeReceiptCreationAttributes extends Optional<FeeReceiptAttributes, 'id' | 'uuid'> {}

export class FeeReceipt extends Model<FeeReceiptAttributes, FeeReceiptCreationAttributes>
  implements FeeReceiptAttributes {
  public id!: bigint;
  public uuid!: string;
  public enrollmentId!: bigint;
  public receiptNumber!: string;
  public amountPaid!: number;
  public paymentMethod!: 'Cash' | 'BankTransfer' | 'POS' | 'Online';
  public paymentDate!: Date;
  public session!: string;
  public balance!: number;
  public status!: 'Paid' | 'PartPayment' | 'Pending';
  public notes?: string;
  public issuedById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof FeeReceipt {
    FeeReceipt.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        enrollmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Enrollment ID' },
        receiptNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Receipt number' },
        amountPaid: { type: DataTypes.DECIMAL(12, 2), allowNull: false, comment: 'Amount paid' },
        paymentMethod: { type: DataTypes.ENUM('Cash', 'BankTransfer', 'POS', 'Online'), allowNull: false },
        paymentDate: { type: DataTypes.DATEONLY, allowNull: false, comment: 'Date payment was made' },
        session: { type: DataTypes.STRING(20), allowNull: false, comment: 'Academic session, e.g. 2026/2027' },
        balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, comment: 'Remaining balance owed after this payment' },
        status: { type: DataTypes.ENUM('Paid', 'PartPayment', 'Pending'), defaultValue: 'Paid' },
        notes: { type: DataTypes.TEXT, allowNull: true },
        issuedById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'User who recorded this payment' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'fee_receipts', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['enrollmentId'], name: 'idx_fee_receipts_enrollmentId' },
          { fields: ['receiptNumber'], name: 'idx_fee_receipts_receiptNumber' },
          { fields: ['status'], name: 'idx_fee_receipts_status' },
          { fields: ['uuid'], name: 'idx_fee_receipts_uuid' },
        ],
        comment: 'School fee payment receipts, tied to a course enrollment'
      }
    );
    return FeeReceipt;
  }
}
