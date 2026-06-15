import { Model } from 'sequelize';
export interface IOrganizationSettings {
    id: bigint;
    organizationId: bigint;
    taxRate: number;
    professionalTaxRate?: number;
    providentFundRate?: number;
    fiscalYearStart: number;
    currencyCode: string;
    dateFormat: string;
    defaultPaymentTerms: number;
    financialYearEndMonth: number;
    invoicePrefix: string;
    poPrefix: string;
    settings?: JSON;
    updatedAt: Date;
}
export declare class OrganizationSettings extends Model<IOrganizationSettings> implements IOrganizationSettings {
    id: bigint;
    organizationId: bigint;
    taxRate: number;
    professionalTaxRate?: number;
    providentFundRate?: number;
    fiscalYearStart: number;
    currencyCode: string;
    dateFormat: string;
    defaultPaymentTerms: number;
    financialYearEndMonth: number;
    invoicePrefix: string;
    poPrefix: string;
    settings?: JSON;
    updatedAt: Date;
}
export default OrganizationSettings;
//# sourceMappingURL=OrganizationSettings.model.d.ts.map