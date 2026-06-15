import { Model, Optional, Sequelize } from 'sequelize';
interface SupplierAttributes {
    id: bigint;
    uuid: string;
    supplierCode: string;
    supplierName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    taxId?: string;
    paymentTerms?: string;
    status: 'Active' | 'Inactive' | 'Blocked';
    rating?: number;
    notes?: string;
    deletedAt?: Date;
}
interface SupplierCreationAttributes extends Optional<SupplierAttributes, 'id' | 'uuid'> {
}
export declare class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes> implements SupplierAttributes {
    id: bigint;
    uuid: string;
    supplierCode: string;
    supplierName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    taxId?: string;
    paymentTerms?: string;
    status: 'Active' | 'Inactive' | 'Blocked';
    rating?: number;
    notes?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Supplier;
}
export {};
//# sourceMappingURL=Supplier.model.d.ts.map