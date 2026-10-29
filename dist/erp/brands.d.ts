export type BrandCode = 'VM' | 'KS' | 'BM' | 'MF';
export interface BrandProfileSeed {
    code: BrandCode;
    departmentName: string;
    displayName: string;
    tagline: string;
    description: string;
    website: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    logoPath: string;
    primaryColor: string;
    secondaryColor: string;
    receiptPrefix: string;
    subDepartments: {
        code: string;
        name: string;
        description: string;
    }[];
}
export declare const BRANDS: BrandProfileSeed[];
export declare const BRAND_BY_CODE: Record<string, BrandProfileSeed>;
export declare const HEAD_OFFICE: {
    branchCode: string;
    branchName: string;
    country: string;
    state: string;
    city: string;
    address: string;
    phone: string;
    email: string;
};
//# sourceMappingURL=brands.d.ts.map