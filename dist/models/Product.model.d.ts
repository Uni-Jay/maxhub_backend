import { Model } from 'sequelize';
export interface IProduct {
    id: bigint;
    organizationId: bigint;
    productCode: string;
    productName: string;
    category: string;
    description?: string;
    unitPrice: number;
    standardCost: number;
    type: 'Product' | 'Service';
    sku?: string;
    status: 'Active' | 'Inactive' | 'Discontinued';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Product extends Model<IProduct> implements IProduct {
    id: bigint;
    organizationId: bigint;
    productCode: string;
    productName: string;
    category: string;
    description?: string;
    unitPrice: number;
    standardCost: number;
    type: 'Product' | 'Service';
    sku?: string;
    status: 'Active' | 'Inactive' | 'Discontinued';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Product;
//# sourceMappingURL=Product.model.d.ts.map