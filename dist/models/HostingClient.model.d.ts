import { Model } from 'sequelize';
export interface IHostingClient {
    id: bigint;
    organizationId: bigint;
    clientName: string;
    contactPerson: string;
    email: string;
    phone: string;
    company: string;
    websiteDomain?: string;
    hostingType: 'Shared' | 'VPS' | 'Dedicated' | 'Cloud' | 'Other';
    serverLocation?: string;
    monthlyBillingAmount: number;
    billingCycle: 'Monthly' | 'Quarterly' | 'Annually';
    renewalDate: Date;
    status: 'Active' | 'Inactive' | 'Suspended' | 'Expired';
    assignedAccount?: bigint;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class HostingClient extends Model<IHostingClient> implements IHostingClient {
    id: bigint;
    organizationId: bigint;
    clientName: string;
    contactPerson: string;
    email: string;
    phone: string;
    company: string;
    websiteDomain?: string;
    hostingType: 'Shared' | 'VPS' | 'Dedicated' | 'Cloud' | 'Other';
    serverLocation?: string;
    monthlyBillingAmount: number;
    billingCycle: 'Monthly' | 'Quarterly' | 'Annually';
    renewalDate: Date;
    status: 'Active' | 'Inactive' | 'Suspended' | 'Expired';
    assignedAccount?: bigint;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default HostingClient;
//# sourceMappingURL=HostingClient.model.d.ts.map