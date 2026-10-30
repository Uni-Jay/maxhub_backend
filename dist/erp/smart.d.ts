import { Router } from 'express';
export declare const WRITE_KINDS: Record<string, string>;
interface SummaryItem {
    kind: string;
    text: string;
    url: string;
    count?: number;
    urgent?: boolean;
}
export declare function buildSummary(uid: number, ctx?: {
    policies?: Map<number, number>;
    birthdays?: string[];
    management?: boolean;
    accounts?: boolean;
}): Promise<{
    date: string;
    firstName: any;
    items: SummaryItem[];
}>;
export declare function runDailySummaries(): Promise<number>;
export declare function smartRouter(): Router;
export {};
//# sourceMappingURL=smart.d.ts.map