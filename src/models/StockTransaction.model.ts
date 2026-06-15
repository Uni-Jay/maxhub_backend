import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface StockTransactionAttributes {
  id: bigint;
  uuid: string;
  warehouseId: bigint;
  itemId: bigint;
  transactionType: 'In' | 'Out' | 'Adjustment' | 'Transfer' | 'Damage' | 'Expired';
  quantity: number;
  referenceDocument?: string;
  referenceId?: bigint;
  notes?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface StockTransactionCreationAttributes extends Optional<StockTransactionAttributes, 'id' | 'uuid'> {}

export class StockTransaction extends Model<StockTransactionAttributes, StockTransactionCreationAttributes>
  implements StockTransactionAttributes {
  public id!: bigint;
  public uuid!: string;
  public warehouseId!: bigint;
  public itemId!: bigint;
  public transactionType!: 'In' | 'Out' | 'Adjustment' | 'Transfer' | 'Damage' | 'Expired';
  public quantity!: number;
  public referenceDocument?: string;
  public referenceId?: bigint;
  public notes?: string;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StockTransaction {
    StockTransaction.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        warehouseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Warehouse ID' },
        itemId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Item ID' },
        transactionType: { type: DataTypes.ENUM('In', 'Out', 'Adjustment', 'Transfer', 'Damage', 'Expired'), allowNull: false },
        quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Quantity' },
        referenceDocument: { type: DataTypes.STRING(50), allowNull: true, comment: 'Reference document type' },
        referenceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Reference ID' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Notes' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'stock_transactions', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['warehouseId'], name: 'idx_stock_transactions_warehouseId' },
          { fields: ['itemId'], name: 'idx_stock_transactions_itemId' },
          { fields: ['transactionType'], name: 'idx_stock_transactions_transactionType' },
          { fields: ['createdById'], name: 'idx_stock_transactions_createdById' },
          { fields: ['createdAt'], name: 'idx_stock_transactions_createdAt' },
          { fields: ['uuid'], name: 'idx_stock_transactions_uuid' },
        ],
        comment: 'Stock transactions'
      }
    );
    return StockTransaction;
  }
}
