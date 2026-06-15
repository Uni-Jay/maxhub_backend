import { Model, Optional, Sequelize } from 'sequelize';
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
interface PurchaseOrderCreationAttributes extends Optional<PurchaseOrderAttributes, 'id' | 'uuid'> {
}
export declare class PurchaseOrder extends Model<PurchaseOrderAttributes, PurchaseOrderCreationAttributes> implements PurchaseOrderAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof PurchaseOrder;
}
export {};
//# sourceMappingURL=PurchaseOrder.model.d.ts.map