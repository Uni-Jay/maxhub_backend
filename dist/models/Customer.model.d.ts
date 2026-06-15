import { Model } from 'sequelize';
export interface ICustomer {
    id: bigint;
    organizationId: bigint;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    businessName?: string;
    businessType?: 'Wholesale' | 'Retail' | 'Distributor' | 'Individual';
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    totalPurchases: number;
    totalSpent: number;
    status: 'Active' | 'Inactive' | 'Blacklisted' | 'VIP';
    assignedSalesRep?: bigint;
    lastPurchaseDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Customer extends Model<ICustomer> implements ICustomer {
    id: bigint;
    organizationId: bigint;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    businessName?: string;
    businessType?: 'Wholesale' | 'Retail' | 'Distributor' | 'Individual';
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    totalPurchases: number;
    totalSpent: number;
    status: 'Active' | 'Inactive' | 'Blacklisted' | 'VIP';
    assignedSalesRep?: bigint;
    lastPurchaseDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Customer;
//# sourceMappingURL=Customer.model.d.ts.map