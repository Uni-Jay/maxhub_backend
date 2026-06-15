import { Model, Optional, Sequelize } from 'sequelize';
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
interface StockTransactionCreationAttributes extends Optional<StockTransactionAttributes, 'id' | 'uuid'> {
}
export declare class StockTransaction extends Model<StockTransactionAttributes, StockTransactionCreationAttributes> implements StockTransactionAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StockTransaction;
}
export {};
//# sourceMappingURL=StockTransaction.model.d.ts.map