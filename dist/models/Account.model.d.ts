import { Model, Optional, Sequelize } from 'sequelize';
interface AccountAttributes {
    id: bigint;
    uuid: string;
    accountCode: string;
    accountName: string;
    accountType: 'Business' | 'Individual' | 'Government' | 'NGO' | 'Other';
    industry?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    ownerUserId?: bigint;
    status: 'Active' | 'Inactive' | 'Prospect' | 'Paused';
    annualRevenue?: number;
    numberOfEmployees?: number;
    deletedAt?: Date;
}
interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'uuid'> {
}
export declare class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
    id: bigint;
    uuid: string;
    accountCode: string;
    accountName: string;
    accountType: 'Business' | 'Individual' | 'Government' | 'NGO' | 'Other';
    industry?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    ownerUserId?: bigint;
    status: 'Active' | 'Inactive' | 'Prospect' | 'Paused';
    annualRevenue?: number;
    numberOfEmployees?: number;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Account;
}
export {};
//# sourceMappingURL=Account.model.d.ts.map