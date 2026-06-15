import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface PurchaseOrderAttributes {
  id: bigint;
  uuid: string;
  poCode: string;
  supplierId: bigint;
  poDate: Date;
  expectedDeliveryDate: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'Draft' | 'Issued' | 'Confirmed' | 'PartiallyReceived' | 'Received' | 'Cancelled' | 'Rejected';
  notes?: string;
  createdById: bigint;
  approvedBy?: bigint;
  approvedDate?: Date;
  deletedAt?: Date;
}

interface PurchaseOrderCreationAttributes extends Optional<PurchaseOrderAttributes, 'id' | 'uuid'> {}

export class PurchaseOrder extends Model<PurchaseOrderAttributes, PurchaseOrderCreationAttributes>
  implements PurchaseOrderAttributes {
  public id!: bigint;
  public uuid!: string;
  public poCode!: string;
  public supplierId!: bigint;
  public poDate!: Date;
  public expectedDeliveryDate!: Date;
  public subtotal!: number;
  public discount!: number;
  public tax!: number;
  public total!: number;
  public currency!: string;
  public status!: 'Draft' | 'Issued' | 'Confirmed' | 'PartiallyReceived' | 'Received' | 'Cancelled' | 'Rejected';
  public notes?: string;
  public createdById!: bigint;
  public approvedBy?: bigint;
  public approvedDate?: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof PurchaseOrder {
    PurchaseOrder.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        poCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'PO code' },
        supplierId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Supplier ID' },
        poDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'PO date' },
        expectedDeliveryDate: { type: DataTypes.DATE, allowNull: false, comment: 'Expected delivery' },
        subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
        discount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
        tax: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
        total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total' },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
        status: { type: DataTypes.ENUM('Draft', 'Issued', 'Confirmed', 'PartiallyReceived', 'Received', 'Cancelled', 'Rejected'), defaultValue: 'Draft' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Notes' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        approvedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Approved by user ID' },
        approvedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Approval date' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'purchase_orders', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['poCode'], name: 'idx_purchase_orders_poCode' },
          { fields: ['supplierId'], name: 'idx_purchase_orders_supplierId' },
          { fields: ['status'], name: 'idx_purchase_orders_status' },
          { fields: ['expectedDeliveryDate'], name: 'idx_purchase_orders_expectedDeliveryDate' },
          { fields: ['createdById'], name: 'idx_purchase_orders_createdById' },
          { fields: ['uuid'], name: 'idx_purchase_orders_uuid' },
        ],
        comment: 'Purchase orders'
      }
    );
    return PurchaseOrder;
  }
}
