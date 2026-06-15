import { Model, Optional, Sequelize } from 'sequelize';
interface ContactAttributes {
    id: bigint;
    uuid: string;
    contactCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    company?: string;
    position?: string;
    department?: string;
    accountId?: bigint;
    source: 'Direct' | 'Website' | 'Email' | 'Phone' | 'Referral' | 'Event' | 'Social' | 'Other';
    leadScore?: number;
    status: 'Active' | 'Inactive' | 'Lead' | 'Prospect' | 'Converted' | 'Lost';
    ownerUserId?: bigint;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    industry?: string;
    noOfEmployees?: number;
    websiteUrl?: string;
    notes?: string;
    lastContactedDate?: Date;
    nextFollowUpDate?: Date;
    deletedAt?: Date;
}
interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'uuid'> {
}
export declare class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
    id: bigint;
    uuid: string;
    contactCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    company?: string;
    position?: string;
    department?: string;
    accountId?: bigint;
    source: 'Direct' | 'Website' | 'Email' | 'Phone' | 'Referral' | 'Event' | 'Social' | 'Other';
    leadScore?: number;
    status: 'Active' | 'Inactive' | 'Lead' | 'Prospect' | 'Converted' | 'Lost';
    ownerUserId?: bigint;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    industry?: string;
    noOfEmployees?: number;
    websiteUrl?: string;
    notes?: string;
    lastContactedDate?: Date;
    nextFollowUpDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Contact;
    getFullName(): string;
    isFollowUpOverdue(): boolean;
    daysSinceLastContact(): number | null;
}
export {};
//# sourceMappingURL=Contact.model.d.ts.map