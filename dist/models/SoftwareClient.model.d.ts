import { Model } from 'sequelize';
export interface ISoftwareClient {
    id: bigint;
    organizationId: bigint;
    clientName: string;
    contactPerson: string;
    email: string;
    phone: string;
    company: string;
    industryType?: string;
    softwareProjects?: number;
    currentProjectCount: number;
    totalProjectValue: number;
    contractStartDate: Date;
    contractEndDate?: Date;
    status: 'Active' | 'Inactive' | 'Suspended' | 'Terminated';
    assignedAccount?: bigint;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class SoftwareClient extends Model<ISoftwareClient> implements ISoftwareClient {
    id: bigint;
    organizationId: bigint;
    clientName: string;
    contactPerson: string;
    email: string;
    phone: string;
    company: string;
    industryType?: string;
    softwareProjects?: number;
    currentProjectCount: number;
    totalProjectValue: number;
    contractStartDate: Date;
    contractEndDate?: Date;
    status: 'Active' | 'Inactive' | 'Suspended' | 'Terminated';
    assignedAccount?: bigint;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default SoftwareClient;
//# sourceMappingURL=SoftwareClient.model.d.ts.map