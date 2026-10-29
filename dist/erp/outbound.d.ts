export interface BrandInfo {
    code: string;
    displayName: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
    address?: string;
    logoUrl?: string;
    primaryColor?: string;
    tagline?: string;
}
export declare function brandForDepartment(departmentId?: number | null): Promise<BrandInfo>;
export declare function normalisePhone(phone?: string | null): string;
export declare function waLink(phone: string, text: string): string;
export declare function brandEmailHtml(brand: BrandInfo, title: string, bodyHtml: string, cta?: {
    url: string;
    label: string;
}): string;
export declare function sendBrandEmail(brand: BrandInfo, to: string, subject: string, html: string): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function sendWhatsAppText(phone: string, text: string): Promise<{
    ok: boolean;
    mode: 'api' | 'link';
    link: string;
    error?: string;
}>;
export declare function fillPlaceholders(body: string, vars: Record<string, any>): string;
export declare function escapeHtml(s: string): string;
export declare function sanitizeHtml(html: string): string;
//# sourceMappingURL=outbound.d.ts.map