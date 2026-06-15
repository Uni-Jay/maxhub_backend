import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface OrderAttributes {
  id: bigint;
  uuid: string;
  orderCode: string;
  accountId: bigint;
  contactId?: bigint;
  orderDate: Date;
  deliveryDate?: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'Draft' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  shippingAddress?: string;
  notes?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'uuid'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes {
  public id!: bigint;
  public uuid!: string;
  public orderCode!: string;
  public accountId!: bigint;
  public contactId?: bigint;
  public orderDate!: Date;
  public deliveryDate?: Date;
  public subtotal!: number;
  public discount!: number;
  public tax!: number;
  public total!: number;
  public currency!: string;
  public status!: 'Draft' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  public paymentStatus!: 'Unpaid' | 'Partial' | 'Paid';
  public shippingAddress?: string;
  public notes?: string;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Order {
    Order.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        orderCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Order code' },
        accountId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Account ID' },
        contactId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Contact ID' },
        orderDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Order date' },
        deliveryDate: { type: DataTypes.DATE, allowNull: true, comment: 'Expected delivery date' },
        subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
        discount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
        tax: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
        total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total amount' },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
        status: { type: DataTypes.ENUM('Draft', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'), defaultValue: 'Draft' },
        paymentStatus: { type: DataTypes.ENUM('Unpaid', 'Partial', 'Paid'), defaultValue: 'Unpaid' },
        shippingAddress: { type: DataTypes.TEXT, allowNull: true, comment: 'Shipping address' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Notes' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'orders', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['orderCode'], name: 'idx_orders_orderCode' },
          { fields: ['accountId'], name: 'idx_orders_accountId' },
          { fields: ['status'], name: 'idx_orders_status' },
          { fields: ['paymentStatus'], name: 'idx_orders_paymentStatus' },
          { fields: ['orderDate'], name: 'idx_orders_orderDate' },
          { fields: ['deliveryDate'], name: 'idx_orders_deliveryDate' },
          { fields: ['createdById'], name: 'idx_orders_createdById' },
          { fields: ['uuid'], name: 'idx_orders_uuid' },
        ],
        comment: 'Sales orders'
      }
    );
    return Order;
  }
}
