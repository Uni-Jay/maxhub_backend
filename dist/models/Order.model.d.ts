import { Model, Optional, Sequelize } from 'sequelize';
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
interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'uuid'> {
}
export declare class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Order;
}
export {};
//# sourceMappingURL=Order.model.d.ts.map