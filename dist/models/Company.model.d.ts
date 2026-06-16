import { Model, Optional, Sequelize } from 'sequelize';
interface CompanyAttributes {
    id: bigint;
    uuid: string;
    name: string;
    code: 'KURIOS_SAT' | 'VISA_MAX' | 'BEAD_MAX' | 'BEADMAX_SCHOOL';
    type: 'Tech & Training' | 'Travel & Visa Services' | 'Jewelry & Sales' | 'Vocational School';
    logo?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    status: 'Active' | 'Inactive';
    settings?: object;
    createdAt?: Date;
    updatedAt?: Date;
}
interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'uuid' | 'status'> {
}
export declare class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
    id: bigint;
    uuid: string;
    name: string;
    code: 'KURIOS_SAT' | 'VISA_MAX' | 'BEAD_MAX' | 'BEADMAX_SCHOOL';
    type: 'Tech & Training' | 'Travel & Visa Services' | 'Jewelry & Sales' | 'Vocational School';
    logo?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    status: 'Active' | 'Inactive';
    settings?: object;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Company;
}
export default Company;
//# sourceMappingURL=Company.model.d.ts.map