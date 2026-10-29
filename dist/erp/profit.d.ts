import { Router } from 'express';
export declare const EXPENSE_CATEGORIES: string[];
export declare function brandMap(): Promise<{
    map: Map<number, number>;
    brands: Array<{
        id: number;
        code: string;
        name: string;
        logoUrl: string | null;
        color: string | null;
    }>;
}>;
interface Bucket {
    income: Record<string, number>;
    expenses: Record<string, number>;
}
export declare function monthBuckets(year: number, month: number): Promise<Map<string, Bucket>>;
export declare function profitRouter(): Router;
export {};
//# sourceMappingURL=profit.d.ts.map