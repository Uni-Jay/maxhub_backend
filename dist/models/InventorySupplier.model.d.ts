import { Model } from 'sequelize';
export interface IInventorySupplier {
    id: bigint;
    organizationId: bigint;
    supplierName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    taxId?: string;
    bankAccountNumber?: string;
    bankName?: string;
    paymentTerms: string;
    leadTime: number;
    status: 'Active' | 'Inactive' | 'Blocked' | 'Suspended';
    ratingScore?: number;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class InventorySupplier extends Model<IInventorySupplier> implements IInventorySupplier {
    id: bigint;
    organizationId: bigint;
    supplierName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    taxId?: string;
    bankAccountNumber?: string;
    bankName?: string;
    paymentTerms: string;
    leadTime: number;
    status: 'Active' | 'Inactive' | 'Blocked' | 'Suspended';
    ratingScore?: number;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default InventorySupplier;
//# sourceMappingURL=InventorySupplier.model.d.ts.map